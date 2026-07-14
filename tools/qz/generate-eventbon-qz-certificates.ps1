[CmdletBinding()]
param(
  [string] $OutputDirectory = (Join-Path $PSScriptRoot "generated"),
  [int] $KeyBits = 2048,
  [int] $RootValidityDays = 1825,
  [int] $SigningValidityDays = 1095
)

$ErrorActionPreference = "Stop"

function Require-OpenSsl {
  $command = Get-Command openssl -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "OpenSSL was not found. Install OpenSSL and ensure 'openssl' is available on PATH."
  }
  return $command.Source
}

function Invoke-OpenSsl {
  param([string[]] $Arguments)

  $output = & $script:OpenSsl @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "OpenSSL failed: openssl $($Arguments -join ' ')`n$($output -join "`n")"
  }
  return $output
}

function Assert-CleanOutputDirectory {
  param([string] $Path)

  if ((Test-Path -LiteralPath $Path) -and (Get-ChildItem -LiteralPath $Path -Force | Select-Object -First 1)) {
    throw "Refusing to write into non-empty output directory '$Path'. Move it aside first, for example to generated-invalid-<timestamp>."
  }
}

function Move-StagedFile {
  param(
    [string] $Source,
    [string] $DestinationDirectory
  )

  Move-Item -LiteralPath $Source -Destination (Join-Path $DestinationDirectory (Split-Path $Source -Leaf)) -Force
}

$script:OpenSsl = Require-OpenSsl
$resolvedOutputDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
Assert-CleanOutputDirectory -Path $resolvedOutputDirectory

$parentDirectory = Split-Path $resolvedOutputDirectory -Parent
if (-not (Test-Path -LiteralPath $parentDirectory)) {
  New-Item -ItemType Directory -Force -Path $parentDirectory | Out-Null
}

$stageDirectory = Join-Path $parentDirectory (".generated-stage-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $stageDirectory | Out-Null

try {
  $rootKey = Join-Path $stageDirectory "eventbon-root-ca-private-key.pem"
  $rootCert = Join-Path $stageDirectory "eventbon-root-ca.crt"
  $signingKey = Join-Path $stageDirectory "private-key.pem"
  $signingCsr = Join-Path $stageDirectory "eventbon-signing.csr"
  $signingCert = Join-Path $stageDirectory "digital-certificate.txt"
  $rootSerial = Join-Path $stageDirectory "eventbon-root-ca.srl"
  $rootConfig = Join-Path $stageDirectory "eventbon-root-ca.openssl.cnf"
  $signingRequestConfig = Join-Path $stageDirectory "eventbon-signing-request.openssl.cnf"
  $signingConfig = Join-Path $stageDirectory "eventbon-signing.openssl.cnf"

  @"
[req]
prompt = no
distinguished_name = dn
string_mask = utf8only

[dn]
O = EO-SOL GmbH
CN = EO-SOL EventBon Root CA

[v3_ca]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true, pathlen:1
keyUsage = critical, keyCertSign, cRLSign
"@ | Set-Content -LiteralPath $rootConfig -Encoding utf8

  @"
[req]
prompt = no
distinguished_name = dn
req_extensions = req_ext
string_mask = utf8only

[dn]
O = EO-SOL GmbH
CN = EventBon

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = eventbons.com
DNS.2 = www.eventbons.com
"@ | Set-Content -LiteralPath $signingRequestConfig -Encoding utf8

  @"
[v3_signing]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature
extendedKeyUsage = codeSigning, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = eventbons.com
DNS.2 = www.eventbons.com
"@ | Set-Content -LiteralPath $signingConfig -Encoding utf8

  Write-Host "Generating EventBon QZ Root CA in '$resolvedOutputDirectory'..."
  Invoke-OpenSsl @("genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:$KeyBits", "-out", $rootKey) | Out-Null
  Invoke-OpenSsl @("req", "-x509", "-new", "-key", $rootKey, "-sha256", "-days", "$RootValidityDays", "-out", $rootCert, "-config", $rootConfig, "-extensions", "v3_ca") | Out-Null

  Write-Host "Generating EventBon QZ signing certificate..."
  Invoke-OpenSsl @("genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:$KeyBits", "-out", $signingKey) | Out-Null
  Invoke-OpenSsl @("req", "-new", "-key", $signingKey, "-out", $signingCsr, "-config", $signingRequestConfig) | Out-Null
  Invoke-OpenSsl @("x509", "-req", "-in", $signingCsr, "-CA", $rootCert, "-CAkey", $rootKey, "-CAcreateserial", "-out", $signingCert, "-days", "$SigningValidityDays", "-sha256", "-extfile", $signingConfig, "-extensions", "v3_signing") | Out-Null

  New-Item -ItemType Directory -Force -Path $resolvedOutputDirectory | Out-Null
  foreach ($file in @($rootKey, $rootCert, $signingKey, $signingCsr, $signingCert, $rootSerial, $rootConfig, $signingRequestConfig, $signingConfig)) {
    if (Test-Path -LiteralPath $file) {
      Move-StagedFile -Source $file -DestinationDirectory $resolvedOutputDirectory
    }
  }

  Write-Host ""
  Write-Host "Created files:"
  Write-Host "- eventbon-root-ca.crt                 Install on QZ Tray printer PC as custom trusted root"
  Write-Host "- eventbon-root-ca-private-key.pem     Store offline; never install on printer PCs"
  Write-Host "- digital-certificate.txt              Store in Vercel as QZ_TRAY_DIGITAL_CERTIFICATE"
  Write-Host "- private-key.pem                      Store in Vercel as QZ_TRAY_PRIVATE_KEY"
  Write-Host ""
  Write-Host "No private key material was printed. Keep '$resolvedOutputDirectory' out of Git."
} catch {
  Remove-Item -LiteralPath $stageDirectory -Recurse -Force -ErrorAction SilentlyContinue
  throw
} finally {
  Remove-Item -LiteralPath $stageDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
