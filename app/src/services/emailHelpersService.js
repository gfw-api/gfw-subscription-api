const _ = require('lodash');
const moment = require('moment');
const d3 = require('d3');

class EmailHelpersService {

    static standardDeviation(data) {
        const avg = _.mean(data);
        return Math.sqrt(_.sum(_.map(data, (i) => (i - avg) ** 2)) / data.length);
    }

    static translateFrequency(status, lang = 'en') {
        const translationsMap = {
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

    static updateMonthTranslations() {
        moment.updateLocale('zh', { monthsShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] });
        moment.updateLocale('id', { monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] });
        moment.updateLocale('pt', { monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] });
        moment.updateLocale('es', { monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] });
        moment.updateLocale('fr', { monthsShort: ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'] });
    }

    static calculateGLADPriorityAreaValues(alerts = [], total = 0) {
        let intactForestAlerts = 0;
        let primaryForestAlerts = 0;
        let peatAlerts = 0;
        let protectedAreasAlerts = 0;
        let plantationAlerts = 0;

        alerts.forEach((al) => {
            if (al.is__ifl_intact_forest_landscape_2016) intactForestAlerts += al.alert__count;
            if (al.is__umd_regional_primary_forest_2001) primaryForestAlerts += al.alert__count;
            if (al.is__peatland) peatAlerts += al.alert__count;
            if (al.wdpa_protected_area__iucn_cat !== 0 && al.wdpa_protected_area__iucn_cat !== '0') protectedAreasAlerts += al.alert__count;
            if (al.gfw_plantation__type !== 0 && al.gfw_plantation__type !== '0') plantationAlerts += al.alert__count;
        });

        const otherAlerts = total - intactForestAlerts - primaryForestAlerts - peatAlerts - protectedAreasAlerts - plantationAlerts;

        return {
            intact_forest: intactForestAlerts,
            primary_forest: primaryForestAlerts,
            peat: peatAlerts,
            protected_areas: protectedAreasAlerts,
            plantations: plantationAlerts,
            other: otherAlerts
        };
    }

    static calculateVIIRSPriorityAreaValues(alerts = [], total = 0) {
        let intactForestAlerts = 0;
        let primaryForestAlerts = 0;
        let peatAlerts = 0;
        let protectedAreasAlerts = 0;
        let plantationAlerts = 0;

        alerts.forEach((al) => {
            if (al.is__intact_forest_landscapes_2016) intactForestAlerts += al.alert__count;
            if (al.is__regional_primary_forest) primaryForestAlerts += al.alert__count;
            if (al.is__peat_land) peatAlerts += al.alert__count;
            if (al.wdpa_protected_area__iucn_cat !== 0 && al.wdpa_protected_area__iucn_cat !== '0') protectedAreasAlerts += al.alert__count;
            if (al.gfw_plantation__type !== 0 && al.gfw_plantation__type !== '0') plantationAlerts += al.alert__count;
        });

        const otherAlerts = total - intactForestAlerts - primaryForestAlerts - peatAlerts - protectedAreasAlerts - plantationAlerts;

        return {
            intact_forest: intactForestAlerts,
            primary_forest: primaryForestAlerts,
            peat: peatAlerts,
            protected_areas: protectedAreasAlerts,
            plantations: plantationAlerts,
            other: otherAlerts
        };
    }

    static async calculateAlertFrequency(thisYearAlerts, lastYearAlerts, lang) {
        const lastYearAverage = _.mean(lastYearAlerts.map((al) => al.alert__count));
        const lastYearStdDev = EmailHelpersService.standardDeviation(lastYearAlerts.map((al) => al.alert__count));
        const currentAvg = _.mean(thisYearAlerts.map((al) => al.alert__count));

        const twoPlusStdDev = currentAvg >= lastYearAverage + (2 * lastYearStdDev);
        const plusStdDev = (currentAvg > lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
        const minusStdDev = (currentAvg < lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
        const twoMinusStdDev = currentAvg <= lastYearAverage - (2 * lastYearStdDev);

        // Calc normality string
        let status = 'average';
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

    static formatAlertCount(alertCount) {
        const formatter = d3.format(',.0s');

        return formatter(alertCount);
    }

    static formatPriorityAreas(priorityAreas) {
        const formatter = d3.format(',.0s');

        return {
            intact_forest: formatter(priorityAreas.intact_forest),
            primary_forest: formatter(priorityAreas.primary_forest),
            peat: formatter(priorityAreas.peat),
            protected_areas: formatter(priorityAreas.protected_areas),
            plantations: formatter(priorityAreas.plantations),
            other: formatter(priorityAreas.other),
        };
    }

}

module.exports = EmailHelpersService;
