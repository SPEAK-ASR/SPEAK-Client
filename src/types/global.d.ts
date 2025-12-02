export {};

declare global {
  interface SinhalaImeController {
    enabled: boolean;
    mode: 'si' | 'en';
    detach: () => void;
  }

  interface SinhalaImeAttachOptions {
    chip?: HTMLElement | string | null;
    toggle?: HTMLElement | string | null;
    chipId?: string;
    toggleId?: string;
  }

  interface Window {
    SinPhoneticIME?: {
      attach: (textarea: HTMLTextAreaElement, opts?: SinhalaImeAttachOptions) => SinhalaImeController | void;
    };
  }
}
