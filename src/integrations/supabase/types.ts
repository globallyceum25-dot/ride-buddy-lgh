export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allocations: {
        Row: {
          actual_dropoff: string | null
          actual_pickup: string | null
          allocated_at: string | null
          allocated_by: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          notes: string | null
          odometer_end: number | null
          odometer_start: number | null
          pool_id: string | null
          request_id: string
          scheduled_dropoff: string | null
          scheduled_pickup: string
          status: Database["public"]["Enums"]["allocation_status"] | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_dropoff?: string | null
          actual_pickup?: string | null
          allocated_at?: string | null
          allocated_by?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          pool_id?: string | null
          request_id: string
          scheduled_dropoff?: string | null
          scheduled_pickup: string
          status?: Database["public"]["Enums"]["allocation_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_dropoff?: string | null
          actual_pickup?: string | null
          allocated_at?: string | null
          allocated_by?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          pool_id?: string | null
          request_id?: string
          scheduled_dropoff?: string | null
          scheduled_pickup?: string
          status?: Database["public"]["Enums"]["allocation_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allocations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "trip_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          blood_group: string | null
          created_at: string
          date_joined: string | null
          emergency_contact: string | null
          employee_id: string | null
          id: string
          is_active: boolean
          is_floating: boolean | null
          license_expiry: string | null
          license_number: string
          license_type: Database["public"]["Enums"]["license_type"] | null
          location_id: string | null
          notes: string | null
          status: Database["public"]["Enums"]["driver_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          date_joined?: string | null
          emergency_contact?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean
          is_floating?: boolean | null
          license_expiry?: string | null
          license_number: string
          license_type?: Database["public"]["Enums"]["license_type"] | null
          location_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          date_joined?: string | null
          emergency_contact?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean
          is_floating?: boolean | null
          license_expiry?: string | null
          license_number?: string
          license_type?: Database["public"]["Enums"]["license_type"] | null
          location_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          is_active: boolean
          name: string
          operating_hours_end: string | null
          operating_hours_start: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          is_active?: boolean
          name: string
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          is_active?: boolean
          name?: string
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cost_center: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          department?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_history: {
        Row: {
          action: string
          created_at: string
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: string
          notes: string | null
          performed_by: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"] | null
        }
        Insert: {
          action: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          request_id: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Update: {
          action?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_passengers: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_passengers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_id: string | null
          cost_center: string | null
          created_at: string
          dropoff_location: string
          id: string
          notes: string | null
          passenger_count: number
          pickup_datetime: string
          pickup_location: string
          priority: Database["public"]["Enums"]["request_priority"]
          purpose: string
          rejection_reason: string | null
          request_number: string | null
          requester_id: string
          return_datetime: string | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["request_status"]
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_id?: string | null
          cost_center?: string | null
          created_at?: string
          dropoff_location: string
          id?: string
          notes?: string | null
          passenger_count?: number
          pickup_datetime: string
          pickup_location: string
          priority?: Database["public"]["Enums"]["request_priority"]
          purpose: string
          rejection_reason?: string | null
          request_number?: string | null
          requester_id: string
          return_datetime?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_id?: string | null
          cost_center?: string | null
          created_at?: string
          dropoff_location?: string
          id?: string
          notes?: string | null
          passenger_count?: number
          pickup_datetime?: string
          pickup_location?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          purpose?: string
          rejection_reason?: string | null
          request_number?: string | null
          requester_id?: string
          return_datetime?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Relationships: []
      }
      trip_pools: {
        Row: {
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          id: string
          pool_number: string | null
          route_summary: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["pool_status"] | null
          total_passengers: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          id?: string
          pool_number?: string | null
          route_summary?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["pool_status"] | null
          total_passengers?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          id?: string
          pool_number?: string | null
          route_summary?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["pool_status"] | null
          total_passengers?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_pools_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_pools_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number | null
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          insurance_expiry: string | null
          is_active: boolean
          last_service_date: string | null
          location_id: string | null
          make: string | null
          model: string | null
          next_service_due: string | null
          notes: string | null
          odometer: number | null
          ownership: Database["public"]["Enums"]["ownership_type"] | null
          registration_expiry: string | null
          registration_number: string
          status: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          year: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          last_service_date?: string | null
          location_id?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          odometer?: number | null
          ownership?: Database["public"]["Enums"]["ownership_type"] | null
          registration_expiry?: string | null
          registration_number: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          year?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          last_service_date?: string | null
          location_id?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          odometer?: number | null
          ownership?: Database["public"]["Enums"]["ownership_type"] | null
          registration_expiry?: string | null
          registration_number?: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      allocation_status:
        | "scheduled"
        | "dispatched"
        | "in_progress"
        | "completed"
        | "cancelled"
      app_role:
        | "staff"
        | "driver"
        | "approver"
        | "location_coordinator"
        | "group_admin"
      driver_status: "available" | "on_trip" | "on_leave" | "inactive"
      fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng"
      license_type: "light" | "heavy" | "commercial"
      ownership_type: "owned" | "leased" | "rented"
      pool_status:
        | "pending"
        | "confirmed"
        | "dispatched"
        | "completed"
        | "cancelled"
      request_priority: "normal" | "urgent" | "vip"
      request_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "allocated"
        | "in_progress"
        | "completed"
        | "cancelled"
      trip_type: "one_way" | "round_trip" | "multi_stop"
      vehicle_status:
        | "available"
        | "in_trip"
        | "maintenance"
        | "breakdown"
        | "retired"
      vehicle_type: "sedan" | "suv" | "van" | "minibus" | "bus" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      allocation_status: [
        "scheduled",
        "dispatched",
        "in_progress",
        "completed",
        "cancelled",
      ],
      app_role: [
        "staff",
        "driver",
        "approver",
        "location_coordinator",
        "group_admin",
      ],
      driver_status: ["available", "on_trip", "on_leave", "inactive"],
      fuel_type: ["petrol", "diesel", "electric", "hybrid", "cng"],
      license_type: ["light", "heavy", "commercial"],
      ownership_type: ["owned", "leased", "rented"],
      pool_status: [
        "pending",
        "confirmed",
        "dispatched",
        "completed",
        "cancelled",
      ],
      request_priority: ["normal", "urgent", "vip"],
      request_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "allocated",
        "in_progress",
        "completed",
        "cancelled",
      ],
      trip_type: ["one_way", "round_trip", "multi_stop"],
      vehicle_status: [
        "available",
        "in_trip",
        "maintenance",
        "breakdown",
        "retired",
      ],
      vehicle_type: ["sedan", "suv", "van", "minibus", "bus", "other"],
    },
  },
} as const
