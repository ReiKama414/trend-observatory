import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Dataset, EventAnnotation, MovingAverageConfig, TimeGranularity, AggregationMethod, MissingDataMethod, TransformMode, ActiveTab } from '../types'

export interface WorkspaceSettings {
  granularity: TimeGranularity
  aggregation: AggregationMethod
  missingMethod: MissingDataMethod
  transformMode: TransformMode
  baseDate: string
  maConfig: MovingAverageConfig
  activeTab: ActiveTab
}

interface TrendObservatoryDB extends DBSchema {
  datasets: {
    key: string
    value: Dataset
  }
  events: {
    key: string
    value: EventAnnotation
  }
  settings: {
    key: string
    value: { key: string; value: any }
  }
}

const DB_NAME = 'trend_observatory_db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TrendObservatoryDB>> | null = null

export function getDB(): Promise<IDBPDatabase<TrendObservatoryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TrendObservatoryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('datasets')) {
          db.createObjectStore('datasets', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// Dataset Operations
export async function dbGetAllDatasets(): Promise<Dataset[]> {
  try {
    const db = await getDB()
    return await db.getAll('datasets')
  } catch (err) {
    console.error('Failed to load datasets from IndexedDB:', err)
    return []
  }
}

export async function dbSaveDataset(dataset: Dataset): Promise<void> {
  try {
    const db = await getDB()
    await db.put('datasets', dataset)
  } catch (err) {
    console.error('Failed to save dataset to IndexedDB:', err)
  }
}

export async function dbSaveAllDatasets(datasets: Dataset[]): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('datasets', 'readwrite')
    await tx.store.clear()
    for (const ds of datasets) {
      await tx.store.put(ds)
    }
    await tx.done
  } catch (err) {
    console.error('Failed to batch save datasets to IndexedDB:', err)
  }
}

export async function dbDeleteDataset(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('datasets', id)
  } catch (err) {
    console.error('Failed to delete dataset from IndexedDB:', err)
  }
}

export async function dbClearDatasets(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('datasets')
  } catch (err) {
    console.error('Failed to clear datasets from IndexedDB:', err)
  }
}

// Event Operations
export async function dbGetAllEvents(): Promise<EventAnnotation[]> {
  try {
    const db = await getDB()
    return await db.getAll('events')
  } catch (err) {
    console.error('Failed to load events from IndexedDB:', err)
    return []
  }
}

export async function dbSaveAllEvents(events: EventAnnotation[]): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('events', 'readwrite')
    await tx.store.clear()
    for (const evt of events) {
      await tx.store.put(evt)
    }
    await tx.done
  } catch (err) {
    console.error('Failed to batch save events to IndexedDB:', err)
  }
}

export async function dbSaveEvent(event: EventAnnotation): Promise<void> {
  try {
    const db = await getDB()
    await db.put('events', event)
  } catch (err) {
    console.error('Failed to save event to IndexedDB:', err)
  }
}

export async function dbDeleteEvent(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('events', id)
  } catch (err) {
    console.error('Failed to delete event from IndexedDB:', err)
  }
}

export async function dbClearEvents(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('events')
  } catch (err) {
    console.error('Failed to clear events from IndexedDB:', err)
  }
}

// Settings Operations
export async function dbGetSettings(): Promise<Partial<WorkspaceSettings> | null> {
  try {
    const db = await getDB()
    const record = await db.get('settings', 'workspace_settings')
    return record ? record.value : null
  } catch (err) {
    console.error('Failed to load settings from IndexedDB:', err)
    return null
  }
}

export async function dbSaveSettings(settings: WorkspaceSettings): Promise<void> {
  try {
    const db = await getDB()
    await db.put('settings', {
      key: 'workspace_settings',
      value: settings,
    })
  } catch (err) {
    console.error('Failed to save settings to IndexedDB:', err)
  }
}
