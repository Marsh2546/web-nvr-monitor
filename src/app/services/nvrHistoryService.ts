import { supabase } from '../lib/supabase'
import { NVRStatus } from '../types/nvr'

export interface NVRStatusHistory {
  id: number
  nvr_id: string
  nvr_name: string
  district: string
  location: string
  onu_ip: string
  ping_onu: boolean
  nvr_ip: string
  ping_nvr: boolean
  hdd_status: boolean
  normal_view: boolean
  check_login: boolean
  camera_count: number
  recorded_at: string
  source: string
}

export async function fetchNVRStatusHistory(date: string): Promise<NVRStatus[]> {
  try {
    // Parse date and create range for the entire day
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    
    // Create start and end of day in local timezone, then convert to UTC
    const startOfDay = new Date(year, month, day, 0, 0, 0);
    const endOfDay = new Date(year, month, day + 1, 0, 0, 0);
    
    // First get the count to see how many records exist
    const { count, error: countError } = await supabase
      .from('nvr_status_history')
      .select('*', { count: 'exact', head: true })
      .gte('recorded_at', startOfDay.toISOString())
      .lt('recorded_at', endOfDay.toISOString())

    if (countError) {
      console.error('Error counting NVR status history:', countError)
    } else {
      console.log(`Found ${count} total records for ${date}`)
    }
    
    // If no records, return empty array
    if (!count || count === 0) {
      return []
    }
    
    // Use pagination to fetch all data
    const allData: NVRStatusHistory[] = []
    const pageSize = 1000
    let page = 0
    
    while (page * pageSize < count) {
      const { data, error } = await supabase
        .from('nvr_status_history')
        .select('*')
        .gte('recorded_at', startOfDay.toISOString())
        .lt('recorded_at', endOfDay.toISOString())
        .order('district', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error(`Error fetching page ${page}:`, error)
        throw error
      }

      if (data && data.length > 0) {
        allData.push(...data)
        console.log(`Fetched page ${page + 1}: ${data.length} records`)
      }

      // If we got less than pageSize, we're done
      if (!data || data.length < pageSize) {
        break
      }

      page++
    }

    console.log(`Total fetched records: ${allData.length}`)

    // Transform to NVRStatus format
    return allData.map((item: NVRStatusHistory) => ({
      id: item.nvr_id,
      nvr: item.nvr_name,
      district: item.district,
      location: item.location,
      onu_ip: item.onu_ip,
      ping_onu: item.ping_onu,
      nvr_ip: item.nvr_ip,
      ping_nvr: item.ping_nvr,
      hdd_status: item.hdd_status,
      normal_view: item.normal_view,
      check_login: item.check_login,
      camera_count: item.camera_count,
      date_updated: item.recorded_at
    }))
  } catch (error) {
    console.error('Failed to fetch NVR status history:', error)
    return []
  }
}

export async function fetchAllNVRHistory(): Promise<NVRStatusHistory[]> {
  try {
    const { data, error } = await supabase
      .from('nvr_status_history')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(10) // Get only 10 records for debugging

    if (error) {
      console.error('Error fetching all NVR history:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch all NVR history:', error)
    return []
  }
}

export async function fetchAvailableDates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('nvr_status_history')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })

    if (error) {
      console.error('Error fetching available dates:', error)
      return []
    }

    // Get unique dates
    const uniqueDates = [...new Set(data?.map((item: { recorded_at: string }) => item.recorded_at) || [])]
    return uniqueDates
  } catch (error) {
    console.error('Failed to fetch available dates:', error)
    return []
  }
}
