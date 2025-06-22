// Mock chrome API
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
  },
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://extension-id/${path}`),
    openOptionsPage: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
  },
  offscreen: {
    createDocument: vi.fn(),
    closeDocument: vi.fn(),
  },
} as unknown as typeof chrome;
