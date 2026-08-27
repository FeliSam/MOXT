import { CatalogArchiveTabs } from '../../components/ui/CatalogArchiveTabs'

export function PublicationCatalogNav({
  typeTab,
  onTypeTab,
  typeTabs,
  typeCounts,
  typeLabel,
  archiveTab,
  onArchiveTab,
  archiveCounts,
  showArchives = false,
  activeLabel,
  archivedLabel,
}) {
  return (
    <>
      {showArchives ? (
        <CatalogArchiveTabs
          variant="underline"
          active={archiveTab}
          onChange={onArchiveTab}
          tabs={[
            {
              key: 'active',
              label: activeLabel,
              count: archiveCounts.active,
              alwaysShow: true,
            },
            {
              key: 'archived',
              label: archivedLabel,
              count: archiveCounts.archived,
            },
          ]}
        />
      ) : null}
      {typeTabs.length > 0 ? (
        <CatalogArchiveTabs
          variant="chips"
          active={typeTab}
          onChange={onTypeTab}
          tabs={typeTabs.map((tab) => ({
            key: tab.id,
            label: typeLabel(tab),
            count: typeCounts[tab.id],
            icon: tab.icon,
            color: tab.color,
          }))}
        />
      ) : null}
    </>
  )
}

