'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PDFFile {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
  file_path: string;
}

export function PDFList() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast.error('ファイルの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: PDFFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .download(file.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('ダウンロードに失敗しました');
    }
  };

  const handleDelete = async (file: PDFFile) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('pdf_files')
        .delete()
        .match({ id: file.id });

      if (dbError) throw dbError;

      setFiles(files.filter((f) => f.id !== file.id));
      toast.success('ファイルを削除しました');
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handlePreview = async (file: PDFFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(file.file_path, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error('プレビューの表示に失敗しました');
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">アップロード済みファイル</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ファイル名</TableHead>
            <TableHead>サイズ</TableHead>
            <TableHead>アップロード日時</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.filename}</TableCell>
              <TableCell>{(file.file_size / 1024 / 1024).toFixed(2)} MB</TableCell>
              <TableCell>
                {format(new Date(file.created_at), 'PPP p', { locale: ja })}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(file)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}