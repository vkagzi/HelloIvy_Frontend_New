export type RepeatableDependsOn = {
  fieldId: string;
  values: string[];
  option: {
    show_default: number;
    min: number;
    columns?: number;
  };
};

export type LayoutItem = {
  type: string;
  content?: string;
  fields?: string[];
  name?: string;
  columns?: number;
  repeatable?: boolean;
  repeatable_option?: {
    add?: string;
    show_default?: number;
    min?: number;
    max?: number;
    columns?: number;
  };
  repeatableDependsOn?: RepeatableDependsOn[];
  visibility?: {
    depends_on: {
      field_id: string;
      value: string[];
    };
  };
  repeatables?: {
    fields: string[];
    name: string;
    repeatable?: boolean;
    repeatable_option?: {
      add: string;
      show_default?: number;
      min?: number;
      max?: number;
      columns?: number;
    };
  };
};

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'text_select'
  | 'checkbox'
  | 'file'
  | 'multi_select';
