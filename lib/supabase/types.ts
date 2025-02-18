export type Device = {
  id: number;
  name: string;
  mac_address: string;
  api_key: string;
  friendly_id: string;
  refresh_interval: number;
  created_at: string;
  updated_at: string;
}

export type Log = {
  id: number;
  device_id: number;
  log_data: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      devices: {
        Row: Device;
        Insert: Omit<Device, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Device, 'id'>>;
      };
      logs: {
        Row: Log;
        Insert: Omit<Log, 'id' | 'created_at'>;
        Update: Partial<Omit<Log, 'id'>>;
      };
    };
  };
}; 