import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  small: { fontSize: 9, color: '#444' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  box: { padding: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, fontSize: 11, fontWeight: 'bold' },
  value: { flex: 1, fontSize: 11 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  signature: { width: '45%', textAlign: 'center', borderTopWidth: 1, borderColor: '#000', paddingTop: 6 },
})

export default function InformeCasoDocument({ caso, seguimientos = [] }) {
  const id = caso?.fields?.ID_Caso || caso?.id || 'caso'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INFORME DE CIERRE DE CASO</Text>
          <Text style={styles.small}>Fecha de emisión: {new Date().toLocaleDateString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>1. Identificación del Caso</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>ID Caso:</Text>
            <Text style={styles.value}>{id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estudiante:</Text>
            <Text style={styles.value}>{caso?.fields?.Estudiante_Responsable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Curso:</Text>
            <Text style={styles.value}>{caso?.fields?.Curso_Incidente}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha incidente:</Text>
            <Text style={styles.value}>{caso?.fields?.Fecha_Incidente}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hora:</Text>
            <Text style={styles.value}>{caso?.fields?.Hora_Incidente}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipificación:</Text>
            <Text style={styles.value}>{caso?.fields?.Tipificacion_Conducta}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Categoría:</Text>
            <Text style={styles.value}>{caso?.fields?.Categoria_Conducta}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. Descripción del Hecho</Text>
        <View style={styles.box}>
          <Text>{caso?.fields?.Descripcion_Breve}</Text>
        </View>

        <Text style={styles.sectionTitle}>3. Seguimiento y Medidas Adoptadas</Text>
        <View>
          {seguimientos.map((s, i) => (
            <View key={s.id || i} style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{s.fields?.Fecha || ''} · {s.fields?.Tipo_Accion || ''}</Text>
              <Text style={{ fontSize: 10 }}>{s.fields?.Detalle || ''}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>4. Resolución Final</Text>
        <View style={styles.box}>
          <Text>El caso fue cerrado conforme al debido proceso establecido en el reglamento interno de convivencia escolar.</Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signature}>Dirección</Text>
          <Text style={styles.signature}>Encargado(a) de Convivencia Escolar</Text>
        </View>
      </Page>
    </Document>
  )
}
