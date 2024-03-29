import { DurationInputArg2 } from 'moment';

export type CronDataset =
    'viirs-active-fires'
    | 'glad-alerts'
    | 'monthly-summary'
    | 'dataset'
    | 'subs-emails-validation'

export interface Cron {
    name: string,
    dataset: CronDataset
    crontab: string
    gap?: {
        value: number
        measure: DurationInputArg2
    }
    periodicity?: {
        value: number,
        measure: DurationInputArg2
    }
}

const CRON_LIST: Cron[] = [
    {
        "name": "Viirs active fires",
        "dataset": "viirs-active-fires",
        "crontab": "00 00 12 * * 0-6",
        "gap": {
            "value": 0,
            "measure": "week"
        },
        "periodicity": {
            "value": 1,
            "measure": "week"
        }
    },
    {
        "name": "Dataset",
        "dataset": "dataset",
        "crontab": "00 15 12 * * 0-6"
    },
    {
        "name": "Glad Alerts",
        "dataset": "glad-alerts",
        "crontab": "00 00 15 * * 0-6",
        "gap": {
            "value": 1,
            "measure": "week"
        },
        "periodicity": {
            "value": 1,
            "measure": "week"
        }
    },
    {
        "name": "Monthly Summary",
        "dataset": "monthly-summary",
        "crontab": "00 00 16 01 * *",
        "gap": {
            "value": 0,
            "measure": "day"
        },
        "periodicity": {
            "value": 1,
            "measure": "months"
        }
    },
    {
        "name": "Subscription emails validation",
        "dataset": "subs-emails-validation",
        "crontab": "00 00 19 * * 0-6"
    }
]

export default CRON_LIST;
