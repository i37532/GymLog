// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import 'react-native-url-polyfill/auto';

// ⚠️ 替换为你自己的 Supabase 项目信息
const SUPABASE_URL = 'https://wymlfgravwmycjstslzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FaDtFSW6bWxgfUzPv0LK9Q_3hs6pg_A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 辅助函数：上传图片到 Supabase Storage
 * @param uri 本地文件路径 (file://...)
 * @returns 上传后的公开 URL
 */
export const uploadImageToSupabase = async (uri: string) => {
  try {
    if (!uri) return null;

    // 1. 生成唯一文件名 (这里暂时偷懒用时间戳，正式版建议用 UUID)
    const ext = uri.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;

    // 2. 读取文件为 Base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // 3. 上传到 'gym-images' bucket (确保你在后台创建了这个 bucket 并设为 Public)
    const { data, error } = await supabase.storage
      .from('gym-images')
      .upload(fileName, decode(base64), {
        contentType: `image/${ext}`,
        upsert: false
      });

    if (error) throw error;

    // 4. 获取公开访问链接
    const { data: { publicUrl } } = supabase.storage
      .from('gym-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
