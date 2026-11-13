export interface LanguageConfig {
  id: string;
  name: string;
  monacoLang: string;
  judge0Id: number;
  extension: string;
  sampleCode: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  timeMs: number;
  error?: string;
  statusDescription?: string;
  memoryKb?: number;
  requiresInput?: boolean;
  autoSuppliedStdin?: boolean;
}

export interface ExtractionResult {
  code: string;
  language: string;
  title?: string;
  notes?: string;
}

export interface SampleSnippet {
  id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  previewGradient: string;
}
