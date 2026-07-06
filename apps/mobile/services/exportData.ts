import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type ExportableTransfer = {
  id: string;
  direction?: string;
  amount?: number;
  currencyFrom?: string;
  currencyTo?: string;
  status?: string;
  createdAt?: string;
};

export async function exportTransfersCSV(transfers: ExportableTransfer[]): Promise<void> {
  const header = 'ID;Direction;Montant;Devise envoi;Devise réception;Statut;Date';
  const rows = transfers.map((t) =>
    [t.id, t.direction || '', t.amount || '', t.currencyFrom || '', t.currencyTo || '', t.status || '', t.createdAt || ''].join(';'),
  );
  const csv = [header, ...rows].join('\n');

  const fileUri = `${FileSystem.documentDirectory}moxt_transferts.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exporter les transferts' });
  }
}

export async function exportSummaryText(data: {
  userName: string;
  transferCount: number;
  totalSent: number;
  totalReceived: number;
  currency: string;
  parcelCount: number;
  listingCount: number;
}): Promise<void> {
  const content = [
    '═══════════════════════════════════════',
    '          MOXT - RÉCAPITULATIF         ',
    '═══════════════════════════════════════',
    '',
    `Utilisateur : ${data.userName}`,
    `Date du rapport : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    '--- Transferts ---',
    `  Nombre total : ${data.transferCount}`,
    `  Total envoyé : ${data.totalSent} ${data.currency}`,
    `  Total reçu   : ${data.totalReceived} ${data.currency}`,
    '',
    '--- Activité ---',
    `  Colis gérés      : ${data.parcelCount}`,
    `  Annonces publiées : ${data.listingCount}`,
    '',
    '═══════════════════════════════════════',
    '  Généré par MOXT',
    '═══════════════════════════════════════',
  ].join('\n');

  const fileUri = `${FileSystem.documentDirectory}moxt_recapitulatif.txt`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Récapitulatif MOXT' });
  }
}
