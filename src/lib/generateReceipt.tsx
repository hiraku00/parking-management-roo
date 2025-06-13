import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import type { Payment, Contractor } from '../types/database';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 100,
  },
  value: {
    flex: 1,
  },
  amount: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});

interface ReceiptProps {
  payment: Payment;
  contractor: Contractor;
}

const Receipt = ({ payment, contractor }: ReceiptProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>領収書</Text>

      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.label}>契約者名：</Text>
          <Text style={styles.value}>{contractor.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>駐車場番号：</Text>
          <Text style={styles.value}>{contractor.parking_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>支払年月：</Text>
          <Text style={styles.value}>{payment.year}年{payment.month}月</Text>
        </View>
      </View>

      <Text style={styles.amount}>
        ￥{payment.amount.toLocaleString()}
      </Text>
    </Page>
  </Document>
);

export const ReceiptDownloadButton = ({ payment, contractor }: ReceiptProps) => (
  <PDFDownloadLink
    document={<Receipt payment={payment} contractor={contractor} />}
    fileName={`receipt_${payment.year}_${payment.month}_${contractor.name}.pdf`}
    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
  >
    {({ loading }) =>
      loading ? '領収書を準備中...' : '領収書をダウンロード'
    }
  </PDFDownloadLink>
);
