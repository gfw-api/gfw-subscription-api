export type BaseAlert = {
    alert__count: number,
    gfw_plantation__type: string,
    idn_forest_area__type: string,
    is__birdlife_alliance_for_zero_extinction_site: boolean,
    is__birdlife_key_biodiversity_area: boolean,
    is__gfw_managed_forest: boolean,
    is__gfw_mining: boolean,
    is__gfw_oil_gas: boolean,
    is__gfw_oil_palm: boolean,
    is__gfw_wood_fiber: boolean,
    is__gmw_mangroves_2016: boolean,
    is__idn_forest_moratorium: boolean,
    is__ifl_intact_forest_landscape_2016: boolean,
    is__landmark_land_right: boolean,
    is__peatland: boolean,
    is__umd_regional_primary_forest_2001: boolean,
    per_forest_concession__type: string,
    rspo_oil_palm__certification_status: string,
    wdpa_protected_area__iucn_cat: string,
}

export type BaseAlertWithArea = BaseAlert & {
    alert_area__ha: number,
}

type WDPAAlert = {
    wdpa_protected_area__id?: string,
    wdpa_protected_area__iso?: string,
    wdpa_protected_area__name?: string,
    wdpa_protected_area__status?: string,
}

export type MonthlySummaryAlert = (GladAlert | ViirsActiveFiresAlert) & {
    type: 'GLAD' | 'VIIRS'
}

export type GladAlert = BaseAlertWithArea & {
    alert__date: string,
    bra_biome__name: string,
    geostore__id: string,
    is__confirmed_alert: boolean,
    umd_glad_landsat_alerts__confidence: string,
    umd_glad_landsat_alerts__date: string,
    whrc_aboveground_co2_emissions__Mg: number
}
export type GladAllAlert = BaseAlertWithArea & WDPAAlert & {
    adm1?: string,
    adm2?: string,
    bra_biome__name: string,
    geostore__id?: string,
    gfw_integrated_alerts__confidence: string,
    gfw_integrated_alerts__date: string,
    iso?: string,
    umd_glad_sentinel2_alerts__confidence: string,
    umd_glad_sentinel2_alerts__date: string,
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string,
    wur_radd_alerts__date: string,
}
export type GladLAlert = BaseAlertWithArea & WDPAAlert & {
    adm1?: string,
    adm2?: string,
    alert__date: string,
    bra_biome__name: string,
    is__confirmed_alert: boolean,
    iso?: string,
    umd_glad_landsat_alerts__confidence: string,
    umd_glad_landsat_alerts__date: string,
    whrc_aboveground_co2_emissions__Mg: number
}
export type GladS2Alert = BaseAlertWithArea & WDPAAlert & {
    adm1?: string,
    adm2?: string,
    bra_biome__name: string,
    geostore__id?: string,
    gfw_integrated_alerts__confidence: string,
    gfw_integrated_alerts__date: string,
    iso?: string,
    umd_glad_sentinel2_alerts__confidence: string,
    umd_glad_sentinel2_alerts__date: string,
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string,
    wur_radd_alerts__date: string,
}
export type GladRaddAlert = BaseAlertWithArea & WDPAAlert & {
    adm1?: string,
    adm2?: string,
    bra_biome__name: string,
    geostore__id?: string,
    gfw_integrated_alerts__confidence: string,
    gfw_integrated_alerts__date: string,
    iso?: string,
    umd_glad_sentinel2_alerts__confidence: string,
    umd_glad_sentinel2_alerts__date: string,
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string,
    wur_radd_alerts__date: string,
}
export type ViirsActiveFiresAlert = BaseAlert & {
    adm1?: string,
    adm2?: string,
    alert__date: string,
    bra_biome__name: string,
    confidence__cat: string,
    geostore__id?: string,
    iso?: string,
    wdpa_protected_area__id?: string,
    wdpa_protected_area__iso?: string,
    wdpa_protected_area__iucn_cat: string,
    wdpa_protected_area__name?: string,
    wdpa_protected_area__status?: string,
}
