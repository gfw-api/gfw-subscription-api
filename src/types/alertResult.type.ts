export type AlertResultType =
    GenericDatasetAlert
    | GladAlertResultType
    | GladAllAlertResultType
    | GladLAlertResultType
    | GladS2AlertResultType
    | GladRaddAlertResultType
    | ViirsActiveFiresAlertResultType

export type GenericDatasetAlert = Record<string, any>

export type BaseAlert = {
    alert__count: number
    gfw_plantation__type: string
    idn_forest_area__type: string
    is__birdlife_alliance_for_zero_extinction_site: boolean
    is__birdlife_key_biodiversity_area: boolean
    is__gfw_managed_forest: boolean
    is__gfw_mining: boolean
    is__gfw_oil_gas: boolean
    is__gfw_oil_palm: boolean
    is__gfw_wood_fiber: boolean
    is__gmw_mangroves_2016: boolean
    is__idn_forest_moratorium: boolean
    is__ifl_intact_forest_landscape_2016: boolean
    is__landmark_land_right: boolean
    is__peatland: boolean
    is__umd_regional_primary_forest_2001: boolean
    per_forest_concession__type: string
    rspo_oil_palm__certification_status: string
    wdpa_protected_area__iucn_cat: string
}

type BaseAlertWithArea = BaseAlert & {
    alert_area__ha: number
}

type BaseAlertWithWDPAArea = BaseAlertWithArea & {
    wdpa_protected_area__id?: string
    wdpa_protected_area__iso?: string
    wdpa_protected_area__name?: string
    wdpa_protected_area__status?: string
}

// Ideally this class would extend both GladAlertResultType and ViirsActiveFiresAlertResultType
// simultaneously, but since that's not possible, here's a hack
export type MonthlySummaryAlert = BaseAlert & {
    type: 'GLAD' | 'VIIRS'

    // Present in both
    bra_biome__name: string
    geostore__id?: string

    // Present in GladAlertResultType
    alert_area__ha?: number
    is__confirmed_alert?: boolean
    umd_glad_landsat_alerts__confidence?: string
    umd_glad_landsat_alerts__date?: string
    whrc_aboveground_co2_emissions__Mg?: number

    // Present in ViirsActiveFiresAlertResultType
    adm1?: string
    adm2?: string
    confidence__cat?: string
    alert__date?: string
    iso?: string
    wdpa_protected_area__id?: string
    wdpa_protected_area__iso?: string
    wdpa_protected_area__name?: string
    wdpa_protected_area__status?: string
}

export type GladAlertResultType = BaseAlertWithArea & {
    bra_biome__name: string
    geostore__id: string
    is__confirmed_alert: boolean
    umd_glad_landsat_alerts__confidence: string
    umd_glad_landsat_alerts__date: string
    whrc_aboveground_co2_emissions__Mg: number
}

export type GladAllAlertResultType = BaseAlertWithWDPAArea & {
    adm1?: string
    adm2?: string
    bra_biome__name: string
    geostore__id?: string
    gfw_integrated_alerts__confidence: string
    gfw_integrated_alerts__date: string
    iso?: string
    umd_glad_sentinel2_alerts__confidence: string
    umd_glad_sentinel2_alerts__date: string
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string
    wur_radd_alerts__date: string
}

export type GladLAlertResultType = BaseAlertWithWDPAArea & {
    adm1?: string
    adm2?: string
    bra_biome__name: string
    is__confirmed_alert: boolean
    iso?: string
    umd_glad_landsat_alerts__confidence: string
    umd_glad_landsat_alerts__date: string
    whrc_aboveground_co2_emissions__Mg: number
}

export type GladS2AlertResultType = BaseAlertWithWDPAArea & {
    adm1?: string
    adm2?: string
    bra_biome__name: string
    geostore__id?: string
    gfw_integrated_alerts__confidence: string
    gfw_integrated_alerts__date: string
    iso?: string
    umd_glad_sentinel2_alerts__confidence: string
    umd_glad_sentinel2_alerts__date: string
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string
    wur_radd_alerts__date: string
}

export type GladRaddAlertResultType = BaseAlertWithWDPAArea & {
    adm1?: string
    adm2?: string
    bra_biome__name: string
    geostore__id?: string
    gfw_integrated_alerts__confidence: string
    gfw_integrated_alerts__date: string
    iso?: string
    umd_glad_sentinel2_alerts__confidence: string
    umd_glad_sentinel2_alerts__date: string
    whrc_aboveground_co2_emissions__Mg: number
    wur_radd_alerts__confidence: string
    wur_radd_alerts__date: string
}

export type ViirsActiveFiresAlertResultType = BaseAlert & {
    adm1?: string
    adm2?: string
    alert__date: string
    bra_biome__name: string
    confidence__cat: string
    geostore__id?: string
    iso?: string
    wdpa_protected_area__id?: string
    wdpa_protected_area__iso?: string
    wdpa_protected_area__name?: string
    wdpa_protected_area__status?: string
}
