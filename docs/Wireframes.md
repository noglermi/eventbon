# Wireframes

## Purpose

These wireframes define the MVP screen structure without prescribing final visual design.

The sales terminal should be the first and primary experience.

## Sales Terminal

```text
+--------------------------------------------------------------+
| eventBon                                      Event Name       |
+-------------------------------+------------------------------+
| Groups                        | Cart                         |
| [Drinks] [Food] [Desserts]    |                              |
| [Other]                       | 2 x Beer             8.00    |
|                               | 1 x Pretzel          3.50    |
| Tiles                         |                              |
| +---------+ +---------+       | Total               11.50    |
| | Beer    | | Wine    |       |                              |
| | 4.00    | | 5.00    |       | Cash received       [20.00]  |
| +---------+ +---------+       | Change               8.50    |
|                               |                              |
| +---------+ +---------+       | [Cash paid] [Card confirmed] |
| | Soda    | | Water   |       |                              |
| | 3.00    | | 2.50    |       | [Print vouchers]             |
| +---------+ +---------+       |                              |
+-------------------------------+------------------------------+
```

## Tile Editing In Place

Sales tiles are edited directly in the terminal. There is no separate article management screen.

```text
+----------------------------+
| Edit Tile                  |
+----------------------------+
| Name       [Beer        ]  |
| Price      [4.00        ]  |
| Group      [Drinks      ]  |
| Color      [swatch      ]  |
| Icon       [optional    ]  |
| Image      [drop image  ]  |
|                            |
| [Cancel]          [Save]   |
+----------------------------+
```

## Statistics And Export

Statistics may appear as a simple terminal-adjacent view, not as a dashboard.

```text
+--------------------------------------------------------------+
| Statistics                                      [Export CSV]   |
+--------------------------------------------------------------+
| Total sales              1,245.00                             |
| Completed sales          184                                  |
| Vouchers sold            392                                  |
|                                                              |
| By group                                                     |
| Drinks                   820.00                               |
| Food                     310.00                               |
| Desserts                  90.00                               |
| Other                     25.00                               |
+--------------------------------------------------------------+
```

## Printing Flow

```text
Cart complete
     |
Payment confirmed
     |
Create voucher records
     |
Send QZ Tray print job
     |
Print vouchers
     |
Return to empty cart
```

## Interface Rules

- The terminal should be optimized for repeated use during an event.
- Primary actions should be visible without navigation.
- Tile editing should stay close to the tile being edited.
- Statistics should be simple and secondary to selling.
- No MVP screen should resemble accounting, inventory, POS management, or ERP software.
