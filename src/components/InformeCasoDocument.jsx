import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import logoColegio from '../assets/veritas.jpg'

const TIPOS_COLORS = {
  'Leve': '#10b981',
  'Grave': '#eab308',
  'Muy Grave': '#8b5cf6',
  'Gravísima': '#ef4444',
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: { 
    marginBottom: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12
  },
  headerText: { flex: 1 },
  logo: { width: 50, height: 50, objectFit: 'contain' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, marginTop: 4, marginBottom: 2, color: '#374151' },
  small: { fontSize: 9, color: '#6b7280' },
  
  section: { marginBottom: 16 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4
  },
  
  infoBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12
  },
  row: { 
    flexDirection: 'row', 
    marginBottom: 6,
    alignItems: 'flex-start'
  },
  label: { 
    width: 130, 
    fontSize: 10, 
    fontWeight: 'bold',
    color: '#374151'
  },
  value: { 
    flex: 1, 
    fontSize: 10,
    color: '#1f2937'
  },
  
  descriptionBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    lineHeight: 1.5
  },
  
  seguimientoItem: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    marginBottom: 8
  },
  seguimientoHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4
  },
  seguimientoDetail: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4
  },
  
  resolutionBox: {
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    lineHeight: 1.5
  },
  
  signatureRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 32,
    gap: 24
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280'
  },
  
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center'
  }
})

export default function InformeCasoDocument({ caso, seguimientos = [] }) {
  const id = caso?.fields?.ID_Caso || caso?.id || 'caso'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>INFORME DE CIERRE DE CASO</Text>
            <Text style={styles.subtitle}>Colegio Carmera Romero de Espinoza - MMDD Concepción</Text>
            <Text style={styles.small}>Fecha de emisión: {new Date().toLocaleDateString('es-CL')}</Text>
          </View>
          <Image src={logoColegio} style={styles.logo} />
        </View>

        {/* 1. IDENTIFICACIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identificación del Caso</Text>
          <View style={styles.infoBox}>
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
              <Text style={styles.value}>{caso?.fields?.Categoria}</Text>
            </View>
          </View>
        </View>

        {/* 2. DESCRIPCIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Descripción del Hecho</Text>
          <View style={styles.descriptionBox}>
            <Text>{caso?.fields?.Descripcion || 'Sin descripción registrada.'}</Text>
          </View>
        </View>

        {/* 3. SEGUIMIENTO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Seguimiento y Medidas Adoptadas</Text>
          {seguimientos.length === 0 ? (
            <View style={styles.infoBox}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>No se registraron seguimientos para este caso.</Text>
            </View>
          ) : (
            seguimientos.map((s, i) => {
              const tipo = s.fields?.Tipificacion_Conducta || ''
              const color = TIPOS_COLORS[tipo] || '#3b82f6'
              return (
                <View
                  key={s.id || i}
                  style={{
                    ...styles.seguimientoItem,
                    borderLeftColor: color,
                  }}
                >
                  <Text style={styles.seguimientoHeader}>
                    {s.fields?.Fecha || 'Sin fecha'} · {s.fields?.Tipo_Accion || 'Sin tipo'}
                  </Text>
                  <Text style={styles.seguimientoDetail}>
                    {s.fields?.Detalle || 'Sin detalle'}
                  </Text>
                </View>
              )
            })
          )}
        </View>

        {/* 4. RESOLUCIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Resolución Final</Text>
          <View style={styles.resolutionBox}>
            <Text>
              El caso fue cerrado conforme al debido proceso establecido en el reglamento 
              interno de convivencia escolar. Se aplicaron las medidas formativas y/o 
              disciplinarias correspondientes según la tipificación de la conducta.
            </Text>
          </View>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Dirección</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Encargado(a) de Convivencia Escolar</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Informe generado automáticamente por el Sistema de Convivencia Escolar
          </Text>
        </View>
      </Page>
    </Document>
  )
}
