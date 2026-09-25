import {
  COVER_STYLE_IDS,
  resolveCoverStyleId,
} from './coverBannerCatalog'
import {
  BusinessMeshTealCover,
  BusinessEditorialCover,
  BusinessGlassFintechCover,
  BusinessTopoEmeraldCover,
} from './BusinessCoverStyles'
import {
  WomanSilkPlumCover,
  WomanGlassLavenderCover,
  WomanBlushFloralCover,
  ManSteelTealCover,
  ManTopoEmeraldCover,
  ManMeshMidnightCover,
  ManPruneNightCover,
  WomanPruneRoseCover,
} from './PersonalCoverStyles'

const STYLE_COMPONENTS = {
  [COVER_STYLE_IDS.BUSINESS_A_MESH]: BusinessMeshTealCover,
  [COVER_STYLE_IDS.BUSINESS_B_EDITORIAL]: BusinessEditorialCover,
  [COVER_STYLE_IDS.BUSINESS_C_GLASS]: BusinessGlassFintechCover,
  [COVER_STYLE_IDS.BUSINESS_D_TOPO]: BusinessTopoEmeraldCover,
  [COVER_STYLE_IDS.WOMAN_A_SILK]: WomanSilkPlumCover,
  [COVER_STYLE_IDS.WOMAN_B_GLASS]: WomanGlassLavenderCover,
  [COVER_STYLE_IDS.WOMAN_C_BLUSH]: WomanBlushFloralCover,
  [COVER_STYLE_IDS.MAN_A_STEEL]: ManSteelTealCover,
  [COVER_STYLE_IDS.MAN_B_TOPO]: ManTopoEmeraldCover,
  [COVER_STYLE_IDS.MAN_C_MESH]: ManMeshMidnightCover,
  [COVER_STYLE_IDS.WOMAN_D_PRUNE]: WomanPruneRoseCover,
  [COVER_STYLE_IDS.MAN_D_PRUNE]: ManPruneNightCover,
}

/**
 * Premium Moxt empty-cover banner (SVG/CSS). Used only when no custom cover URL.
 */
export function MoxtCoverBanner({
  styleId,
  emptyCoverVariant,
  category = 'personal',
  gender,
  className = '',
}) {
  const resolved = resolveCoverStyleId({
    coverStyle: styleId,
    emptyCoverVariant,
    category,
    gender,
  })
  const Component = STYLE_COMPONENTS[resolved] || BusinessEditorialCover
  return <Component className={className} />
}
