'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export function PDFUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('認証が必要です');

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(`${user.id}/${Date.now()}-${file.name}`, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase.from('pdf_files').insert({
        user_id: user.id,
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
      });

      if (dbError) throw dbError;

      toast.success('PDFをアップロードしました');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-8 text-center cursor-pointer border-dashed ${
        isDragActive ? 'border-primary' : 'border-border'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      {isUploading ? (
        <p>アップロード中...</p>
      ) : isDragActive ? (
        <p>ここにドロップしてアップロード</p>
      ) : (
        <div className="space-y-4">
          <p>PDFファイルをドラッグ＆ドロップ、または</p>
          <Button type="button">ファイルを選択</Button>
        </div>
      )}
    </Card>
  );
}