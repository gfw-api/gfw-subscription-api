import _ from 'lodash';
import moment from 'moment';
import * as d3 from 'd3';
import { FormattedPriorityArea, PriorityArea } from 'presenters/presenter.interface';
import { BaseAlert, ViirsActiveFiresAlertResultType } from 'types/alertResult.type';

class EmailHelpersService {

    static standardDeviation(data: number[]): number {
        const avg: number = _.mean(data);
        return Math.sqrt(_.sum(_.map(data, (i: number) => (i - avg) ** 2)) / data.length);
    }

    static translateFrequency(status: string, lang: string = 'en'): string {
        const translationsMap: Record<string, any> = {
            en: {
                'unusually high': 'unusually high',
                high: 'high',
                average: 'average',
                low: 'low',
                'unusually low': 'unusually low',
            },
            pt_BR: {
                'unusually high': 'extraordinariamente alto',
                high: 'alto',
                average: 'normal',
                low: 'baixo',
                'unusually low': 'extraordinariamente baixo',
            },
            fr: {
                'unusually high': 'inhabituellement élevé',
                high: 'haut',
                average: 'moyenne',
                low: 'faible',
                'unusually low': 'inhabituellement bas',
            },
            zh: {
                'unusually high': '异常高',
                high: '高',
                average: '平均',
                low: '低',
                'unusually low': '异常低',
            },
            es_MX: {
                'unusually high': 'inusualmente alto',
                high: 'alto',
                average: 'promedio',
                low: 'bajo',
                'unusually low': 'inusualmente bajo',
            },
            id: {
                'unusually high': 'luar biasa tinggi',
                high: 'tinggi',
                average: 'rata-rata',
                low: 'rendah',
                'unusually low': 'rendah luar biasa',
            },
        };

        return translationsMap[lang][status];
    }

    static updateMonthTranslations(): void {
        moment.updateLocale('zh', { monthsShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] });
        moment.updateLocale('id', { monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] });
        moment.updateLocale('pt', { monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] });
        moment.updateLocale('es', { monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] });
        moment.updateLocale('fr', { monthsShort: ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'] });
    }

    static calculateGLADPriorityAreaValues(alerts: BaseAlert[] = [], total: number = 0): PriorityArea {
        let intactForestAlerts: number = 0;
        let primaryForestAlerts: number = 0;
        let peatAlerts: number = 0;
        let protectedAreasAlerts: number = 0;
        let plantationAlerts: number = 0;

        alerts.forEach((al: BaseAlert) => {
            if (al.is__ifl_intact_forest_landscape_2016) intactForestAlerts += al.alert__count;
            if (al.is__umd_regional_primary_forest_2001) primaryForestAlerts += al.alert__count;
            if (al.is__peatland) peatAlerts += al.alert__count;
            if (al.wdpa_protected_area__iucn_cat) protectedAreasAlerts += al.alert__count;
            if (al.gfw_plantation__type) plantationAlerts += al.alert__count;
        });

        const otherAlerts: number = Math.max(total - intactForestAlerts - primaryForestAlerts - peatAlerts - protectedAreasAlerts - plantationAlerts, 0);

        return {
            intact_forest: intactForestAlerts,
            primary_forest: primaryForestAlerts,
            peat: peatAlerts,
            protected_areas: protectedAreasAlerts,
            plantations: plantationAlerts,
            other: otherAlerts
        };
    }

    static calculateVIIRSPriorityAreaValues(alerts: BaseAlert[] = [], total: number = 0): PriorityArea {
        let intactForestAlerts: number = 0;
        let primaryForestAlerts: number = 0;
        let peatAlerts: number = 0;
        let protectedAreasAlerts: number = 0;
        let plantationAlerts: number = 0;

        alerts.forEach((al: BaseAlert) => {
            if (al.is__ifl_intact_forest_landscape_2016) intactForestAlerts += al.alert__count;
            if (al.is__umd_regional_primary_forest_2001) primaryForestAlerts += al.alert__count;
            if (al.is__peatland) peatAlerts += al.alert__count;
            if (al.wdpa_protected_area__iucn_cat) protectedAreasAlerts += al.alert__count;
            if (al.gfw_plantation__type) plantationAlerts += al.alert__count;
        });

        const otherAlerts: number = Math.max(total - intactForestAlerts - primaryForestAlerts - peatAlerts - protectedAreasAlerts - plantationAlerts, 0);

        return {
            intact_forest: intactForestAlerts,
            primary_forest: primaryForestAlerts,
            peat: peatAlerts,
            protected_areas: protectedAreasAlerts,
            plantations: plantationAlerts,
            other: otherAlerts
        };
    }

    static async calculateAlertFrequency(thisYearAlerts: BaseAlert[], lastYearAlerts: BaseAlert[], lang: string): Promise<string> {
        const lastYearAverage: number = _.mean(lastYearAlerts.map((al: ViirsActiveFiresAlertResultType) => al.alert__count));
        const lastYearStdDev: number = EmailHelpersService.standardDeviation(lastYearAlerts.map((al: BaseAlert) => al.alert__count));
        const currentAvg: number = _.mean(thisYearAlerts.map((al: BaseAlert) => al.alert__count));

        const twoPlusStdDev: boolean = currentAvg > lastYearAverage + (2 * lastYearStdDev);
        const plusStdDev: boolean = (currentAvg > lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
        const minusStdDev: boolean = (currentAvg < lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
        const twoMinusStdDev: boolean = currentAvg < lastYearAverage - (2 * lastYearStdDev);

        // Calc normality string
        let status: string = 'average';
        if (twoPlusStdDev) {
            status = 'unusually high';
        } else if (plusStdDev) {
            status = 'high';
        } else if (minusStdDev) {
            status = 'low';
        } else if (twoMinusStdDev) {
            status = 'unusually high';
        }

        return EmailHelpersService.translateFrequency(status, lang);
    }

    static formatAlertCount(alertCount: number): string {
        return EmailHelpersService.globalFormatter(alertCount);
    }

    static formatPriorityAreas(priorityAreas: PriorityArea): FormattedPriorityArea {
        return {
            intact_forest: EmailHelpersService.globalFormatter(priorityAreas.intact_forest),
            primary_forest: EmailHelpersService.globalFormatter(priorityAreas.primary_forest),
            peat: EmailHelpersService.globalFormatter(priorityAreas.peat),
            protected_areas: EmailHelpersService.globalFormatter(priorityAreas.protected_areas),
            plantations: EmailHelpersService.globalFormatter(priorityAreas.plantations),
            other: EmailHelpersService.globalFormatter(priorityAreas.other),
        };
    }

    static globalFormatter(val: number): string {
        if (val < 1000) {
            return val.toString();
        }

        if (val < 100000) {
            return d3.format('.2s')(val);
        }

        // Greater than 10000
        return d3.format('.1s')(val);
    }

    static roundXDecimals(num: number, x: number = 2): number {
        return +(Number(`${Math.round(Number(`${num}e+${x}`))}e-${x}`));
    }

    static translateAlertType(alertType: string, lang: string): string {
        const translations: Record<string, Record<string, string>> = {
            en: {
                'glad-alerts': 'total alerts',
                'glad-all': 'total alerts',
                'glad-l': 'GLAD-L deforestation alerts',
                'glad-s2': 'GLAD-S2 deforestation alerts',
                'glad-radd': 'RADD deforestation alerts',
            },
            pt_BR: {
                'glad-alerts': 'alertas totais',
                'glad-all': 'alertas totais',
                'glad-l': 'alertas de desmatamento (GLAD-L)',
                'glad-s2': 'alertas de desmatamento (GLAD-S2)',
                'glad-radd': 'alertas de desmatamento (RADD)',
            },
            fr: {
                'glad-alerts': 'alertes totales',
                'glad-all': 'alertes totales',
                'glad-l': 'alertes de déforestation (GLAD-L)',
                'glad-s2': 'alertes de déforestation (GLAD-S2)',
                'glad-radd': 'alertes de déforestation (RADD)',
            },
            zh: {
                'glad-alerts': '警报总数',
                'glad-all': '警报总数',
                'glad-l': '滥伐警报（GLAD-L）',
                'glad-s2': '滥伐警报（GLAD-S2）',
                'glad-radd': '滥伐警报（RADD）',
            },
            es_MX: {
                'glad-alerts': 'alertas totales',
                'glad-all': 'alertas totales',
                'glad-l': 'alertas de deforestación (GLAD-L)',
                'glad-s2': 'alertas de deforestación (GLAD-S2)',
                'glad-radd': 'alertas de deforestación (RADD)',
            },
            id: {
                'glad-alerts': 'peringatan total',
                'glad-all': 'peringatan total',
                'glad-l': 'peringatan deforestasi (GLAD-L)',
                'glad-s2': 'peringatan deforestasi (GLAD-S2)',
                'glad-radd': 'peringatan deforestasi (RADD)',
            },
        };

        return translations[lang][alertType];
    }

}

export default EmailHelpersService;
