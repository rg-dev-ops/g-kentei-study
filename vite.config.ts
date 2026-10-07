import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages ではリポジトリ名のサブパスで配信されるため、相対パスでビルドする
export default defineConfig({
  plugins: [react()],
  base: './',
  // 問題データ（約400問の JSON）を同梱しているため、警告の閾値を上げる
  build: { chunkSizeWarningLimit: 1500 },
});
