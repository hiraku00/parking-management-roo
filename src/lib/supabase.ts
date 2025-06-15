import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getContractorByName = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`契約者情報の取得に失敗しました: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
};

export const getContractorPayments = async (contractorId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`支払い履歴の取得に失敗しました: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
};

export const getAllContractors = async () => {
  try {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`契約者一覧の取得に失敗しました: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
};
