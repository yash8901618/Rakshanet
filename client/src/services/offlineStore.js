// IndexedDB Storage Service for Offline Tactical Mesh Operations
// Enables offline queuing, persistence, and batch sync when network signal is lost.

const DB_NAME = 'VortexCrisisMeshDB';
const DB_VERSION = 1;
const STORE_QUEUE = 'offline_queue';
const STORE_CACHE = 'venue_cache';

class OfflineStore {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB initialization failed, falling back to memory/localStorage', event);
        resolve(null);
      };
    });
  }

  async getDB() {
    if (this.db) return this.db;
    return await this.initPromise;
  }

  // Add an action to the offline queue
  async enqueueAction(action) {
    const db = await this.getDB();
    const item = {
      id: action.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: action.type,
      payload: action.payload,
      timestamp: action.timestamp || Date.now()
    };

    if (!db) {
      // LocalStorage fallback
      try {
        const cur = JSON.parse(localStorage.getItem('vortex_offline_backup') || '[]');
        cur.push(item);
        localStorage.setItem('vortex_offline_backup', JSON.stringify(cur));
      } catch (e) {}
      return item;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  // Retrieve all pending offline items
  async getQueue() {
    const db = await this.getDB();
    if (!db) {
      try {
        return JSON.parse(localStorage.getItem('vortex_offline_backup') || '[]');
      } catch (e) {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  // Clear offline queue upon successful reconciliation
  async clearQueue() {
    const db = await this.getDB();
    try {
      localStorage.removeItem('vortex_offline_backup');
    } catch (e) {}

    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Cache venue snapshot for instant cold-start loading
  async cacheVenueState(key, data) {
    const db = await this.getDB();
    if (!db) return;

    try {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      store.put({ key, data, timestamp: Date.now() });
    } catch (e) {}
  }

  async getCachedVenueState(key) {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result?.data || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
}

export const offlineStore = new OfflineStore();
export default offlineStore;
