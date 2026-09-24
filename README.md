# Gas Bottle Tracker Card

A custom Lovelace card for Home Assistant that displays Gas Bottle Tracker status, bottle level, estimated days remaining, bottle history information and spare bottle controls.

## Requirements

This card is designed to work with the **Gas Bottle Tracker** custom integration.

Integration repository:

https://github.com/coxmitch/gas-bottle-tracker

## Installation with HACS

Add this repository as a custom repository in HACS:

Repository: `https://github.com/coxmitch/gas-bottle-tracker-card`

Category: Dashboard

Install **Gas Bottle Tracker Card**.

Add the card resource if HACS does not register it automatically.

## Card configuration

Example:

```yaml
type: custom:gas-bottle-tracker-card
title: Gas Bottle
remaining_entity: sensor.remaining_percentage
days_entity: sensor.estimated_days_remaining
age_entity: sensor.current_bottle_age
next_change_entity: sensor.estimated_next_change
lifespan_entity: sensor.average_bottle_lifespan
spare_entity: sensor.spare_bottles
bottle_size_entity: sensor.bottle_size
```

## Features

- Bottle level visualization
- GOOD / LOW / CRITICAL / OVERDUE status
- Estimated days remaining
- Bottle size and age
- Average lifespan
- Estimated next change
- Spare bottle count
- Add/remove spare controls
- New Bottle dialog
- Dark/light Home Assistant theme support

## License

MIT
