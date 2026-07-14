[CmdletBinding()]
param(
  [string] $GeneratedDirectory = "",
  [int] $ExpectedKeyBits = 2048
)

$ErrorActionPreference = "Stop"

if (-not $GeneratedDirectory) {
  $GeneratedDirectory = Join-Path $PSScriptRoot "generated"
}

function Require-OpenSsl {
  $command = Get-Command openssl -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "OpenSSL was not found. Install OpenSSL and ensure 'openssl' is available on PATH."
  }
  return $command.Source
}

function Assert-File {
  param([string] $Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Required file missing: $Path"
  }
}

function Invoke-OpenSslText {
  param([string[]] $Arguments)

  $output = & $script:OpenSsl @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "OpenSSL failed: openssl $($Arguments -join ' ')`n$($output -join "`n")"
  }
  return ($output -join "`n")
}

function Invoke-OpenSslFile {
  param([string[]] $Arguments)

  $output = & $script:OpenSsl @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "OpenSSL failed: openssl $($Arguments -join ' ')`n$($output -join "`n")"
  }
}

function Get-DgstHashOnly {
  param([string] $Path)

  $digest = Invoke-OpenSslText @("dgst", "-sha256", $Path)
  if ($digest -notmatch "=\s*([0-9a-fA-F]+)\s*$") {
    throw "Could not parse SHA256 digest: $digest"
  }
  return $Matches[1].ToLowerInvariant()
}

function Convert-CertificatePublicKeyToDer {
  param(
    [string] $CertificatePath,
    [string] $DerOutputPath
  )

  $pemPath = Join-Path $script:VerifyTempDirectory ((Split-Path $DerOutputPath -Leaf) + ".pem")
  Invoke-OpenSslFile @("x509", "-in", $CertificatePath, "-pubkey", "-noout", "-out", $pemPath)
  Invoke-OpenSslFile @("pkey", "-pubin", "-in", $pemPath, "-outform", "DER", "-out", $DerOutputPath)
}

function Convert-CsrPublicKeyToDer {
  param(
    [string] $CsrPath,
    [string] $DerOutputPath
  )

  $pemPath = Join-Path $script:VerifyTempDirectory ((Split-Path $DerOutputPath -Leaf) + ".pem")
  Invoke-OpenSslFile @("req", "-in", $CsrPath, "-pubkey", "-noout", "-out", $pemPath)
  Invoke-OpenSslFile @("pkey", "-pubin", "-in", $pemPath, "-outform", "DER", "-out", $DerOutputPath)
}

function Convert-PrivateKeyPublicKeyToDer {
  param(
    [string] $PrivateKeyPath,
    [string] $DerOutputPath
  )

  Invoke-OpenSslFile @("pkey", "-in", $PrivateKeyPath, "-pubout", "-outform", "DER", "-out", $DerOutputPath)
}

function Get-CertificatePublicKeyFingerprint {
  param([string] $CertificatePath)

  $derPath = Join-Path $script:VerifyTempDirectory "certificate-public-key.der"
  Convert-CertificatePublicKeyToDer -CertificatePath $CertificatePath -DerOutputPath $derPath
  return Get-DgstHashOnly $derPath
}

function Get-CsrPublicKeyFingerprint {
  param([string] $CsrPath)

  $derPath = Join-Path $script:VerifyTempDirectory "csr-public-key.der"
  Convert-CsrPublicKeyToDer -CsrPath $CsrPath -DerOutputPath $derPath
  return Get-DgstHashOnly $derPath
}

function Get-PrivateKeyPublicKeyFingerprint {
  param([string] $PrivateKeyPath)

  $derPath = Join-Path $script:VerifyTempDirectory "private-key-public-key.der"
  Convert-PrivateKeyPublicKeyToDer -PrivateKeyPath $PrivateKeyPath -DerOutputPath $derPath
  return Get-DgstHashOnly $derPath
}

function Assert-Contains {
  param(
    [string] $Value,
    [string] $Expected,
    [string] $Label
  )

  if ($Value -notlike "*$Expected*") {
    throw "$Label does not contain expected value '$Expected'. Actual: $Value"
  }
}

function Assert-Equal {
  param(
    [string] $Left,
    [string] $Right,
    [string] $Label
  )

  if ($Left -ne $Right) {
    throw "$Label mismatch."
  }
}

$script:OpenSsl = Require-OpenSsl

$rootCert = Join-Path $GeneratedDirectory "eventbon-root-ca.crt"
$signingCert = Join-Path $GeneratedDirectory "digital-certificate.txt"
$signingKey = Join-Path $GeneratedDirectory "private-key.pem"
$signingCsr = Join-Path $GeneratedDirectory "eventbon-signing.csr"

Assert-File $rootCert
Assert-File $signingCert
Assert-File $signingKey
Assert-File $signingCsr

$script:VerifyTempDirectory = Join-Path $GeneratedDirectory ".verify"
New-Item -ItemType Directory -Force -Path $script:VerifyTempDirectory | Out-Null

try {
  $firstKeyLine = Get-Content -LiteralPath $signingKey -TotalCount 1
  if ($firstKeyLine -ne "-----BEGIN PRIVATE KEY-----") {
    throw "private-key.pem must be unencrypted PKCS#8 PEM and start with '-----BEGIN PRIVATE KEY-----'."
  }

  $rootSelfSigned = Invoke-OpenSslText @("verify", "-CAfile", $rootCert, $rootCert)
  Assert-Contains $rootSelfSigned ": OK" "Root self-signature verification"

  $chainResult = Invoke-OpenSslText @("verify", "-CAfile", $rootCert, $signingCert)
  Assert-Contains $chainResult ": OK" "Certificate chain verification"

  Invoke-OpenSslFile @("x509", "-in", $rootCert, "-noout", "-checkend", "0")
  Invoke-OpenSslFile @("x509", "-in", $signingCert, "-noout", "-checkend", "0")

  $certFingerprint = Get-CertificatePublicKeyFingerprint $signingCert
  $csrFingerprint = Get-CsrPublicKeyFingerprint $signingCsr
  $keyFingerprint = Get-PrivateKeyPublicKeyFingerprint $signingKey

  Assert-Equal $certFingerprint $csrFingerprint "Signing certificate and CSR public key"
  Assert-Equal $csrFingerprint $keyFingerprint "CSR and private key public key"
  Assert-Equal $certFingerprint $keyFingerprint "Signing certificate and private key public key"

  $keyText = Invoke-OpenSslText @("pkey", "-in", $signingKey, "-text", "-noout")
  Assert-Contains $keyText "Private-Key: ($ExpectedKeyBits bit" "Private key length"

  $rootSubject = Invoke-OpenSslText @("x509", "-in", $rootCert, "-noout", "-subject")
  $rootIssuer = Invoke-OpenSslText @("x509", "-in", $rootCert, "-noout", "-issuer")
  $signingSubject = Invoke-OpenSslText @("x509", "-in", $signingCert, "-noout", "-subject")
  $signingIssuer = Invoke-OpenSslText @("x509", "-in", $signingCert, "-noout", "-issuer")
  $signingCertFingerprint = Invoke-OpenSslText @("x509", "-in", $signingCert, "-noout", "-fingerprint", "-sha256")
  $rootDates = Invoke-OpenSslText @("x509", "-in", $rootCert, "-noout", "-dates")
  $signingDates = Invoke-OpenSslText @("x509", "-in", $signingCert, "-noout", "-dates")
  $signingSan = Invoke-OpenSslText @("x509", "-in", $signingCert, "-noout", "-ext", "subjectAltName")

  Assert-Contains $rootSubject "EO-SOL EventBon Root CA" "Root subject"
  Assert-Contains $rootIssuer "EO-SOL EventBon Root CA" "Root issuer"
  Assert-Contains $signingSubject "EventBon" "Signing certificate subject"
  Assert-Contains $signingIssuer "EO-SOL EventBon Root CA" "Signing certificate issuer"
  Assert-Contains $signingSan "DNS:eventbons.com" "Signing certificate SAN"
  Assert-Contains $signingSan "DNS:www.eventbons.com" "Signing certificate SAN"

  Write-Host "Public metadata:"
  Write-Host $signingSubject
  Write-Host $signingIssuer
  Write-Host $signingCertFingerprint
  Write-Host ($signingDates -replace "`n", "; ")
  Write-Host ($signingSan -replace "`n", "; ")
  Write-Host ""
  Write-Host "Public key fingerprints:"
  Write-Host "digital-certificate.txt: $certFingerprint"
  Write-Host "eventbon-signing.csr:   $csrFingerprint"
  Write-Host "private-key.pem:        $keyFingerprint"
  Write-Host ""
  Write-Host "Root metadata:"
  Write-Host $rootSubject
  Write-Host $rootIssuer
  Write-Host ($rootDates -replace "`n", "; ")
  Write-Host ""
  Write-Host "QZ certificate chain and signing key verified successfully."
} finally {
  Remove-Item -LiteralPath $script:VerifyTempDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
