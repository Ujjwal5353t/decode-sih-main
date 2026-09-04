/**
 * Global DOM Auto-Translator
 *
 * Automatically translates ALL text rendered on any dashboard or page into the
 * user's selected language, without requiring components to be manually hardcoded
 * or wrapped in t().
 *
 * Architecture:
 * 1. WeakMap<Node, string> stores the pristine original English text for every TextNode.
 * 2. Instant translation via UNIVERSAL_PHRASES (0ms).
 * 3. LocalStorage translation cache (0ms).
 * 4. Automatic background batching to Gemini AI backend (/api/v1/translate/batch)
 *    for any new or unmapped dynamic text, automatically caching the result for future visits.
 * 5. MutationObserver automatically translates new dynamic nodes (modals, tabs, cards)
 *    as they mount.
 * 6. Flawless rollback when switching back to English ("en").
 */

import type { SupportedLanguage } from "@/types/i18n";
import {
  translatePhrase,
  getCachedTranslation,
  setCachedTranslation,
} from "./universalTranslator";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "INPUT",
  "TEXTAREA",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "SVG",
  "AUDIO",
  "VIDEO",
  "CANVAS",
]);

class DomAutoTranslator {
  private activeLang: SupportedLanguage = "en";
  private originalTexts = new WeakMap<Node, string>();
  private observer: MutationObserver | null = null;
  private isMutating = false;
  private pendingBatch = new Map<string, Set<Node>>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private inFlightRequests = new Set<string>();

  /**
   * Set the active language. If 'en', reverts all translated text to original English.
   * If non-'en', scans and translates the entire document.
   */
  public setLanguage(lang: SupportedLanguage): void {
    if (this.activeLang === lang) return;
    this.activeLang = lang;

    if (typeof window === "undefined" || !document.body) return;

    if (lang === "en") {
      this.revertAllToEnglish();
    } else {
      this.translateSubtree(document.body);
    }
  }

  /**
   * Initialize observer on document body.
   */
  public init(initialLang: SupportedLanguage): void {
    if (typeof window === "undefined" || !document.body) return;
    this.activeLang = initialLang;

    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        if (this.isMutating || this.activeLang === "en") return;

        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.translateSubtree(node as Element);
              } else if (node.nodeType === Node.TEXT_NODE) {
                this.handleTextNode(node);
              }
            });
          } else if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
            this.handleTextNode(m.target);
          }
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    if (initialLang !== "en") {
      this.translateSubtree(document.body);
    }
  }

  /**
   * Walk an element subtree and translate eligible text nodes.
   */
  public translateSubtree(root: Element): void {
    if (this.isIgnoredElement(root)) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || this.isIgnoredElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let current = walker.nextNode();
    while (current) {
      this.handleTextNode(current);
      current = walker.nextNode();
    }
  }

  /**
   * Process an individual text node.
   */
  private handleTextNode(node: Node): void {
    const raw = node.nodeValue;
    if (!raw) return;

    // Check if we already have the original English text
    let original = this.originalTexts.get(node);
    if (!original) {
      original = raw;
      this.originalTexts.set(node, original);
    }

    if (this.activeLang === "en") {
      if (raw !== original) {
        this.safeSetNodeValue(node, original);
      }
      return;
    }

    const trimmed = original.trim();
    // Ignore empty text, pure numbers, punctuation, or single letters
    if (trimmed.length < 2 || !/[a-zA-Z]{2,}/.test(trimmed)) {
      return;
    }

    // 1. Instant check via universal dictionary
    const direct = translatePhrase(trimmed, this.activeLang);
    if (direct && direct !== trimmed) {
      this.replaceTextPreservingWhitespace(node, original, direct);
      return;
    }

    // 2. Instant check via localStorage cache
    const cached = getCachedTranslation(trimmed, this.activeLang);
    if (cached) {
      this.replaceTextPreservingWhitespace(node, original, cached);
      return;
    }

    // 3. Queue for background AI translation batch
    if (!this.pendingBatch.has(trimmed)) {
      this.pendingBatch.set(trimmed, new Set());
    }
    this.pendingBatch.get(trimmed)!.add(node);
    this.scheduleBatchFlush();
  }

  /**
   * Revert all known text nodes back to their pristine English originals.
   */
  private revertAllToEnglish(): void {
    if (typeof window === "undefined" || !document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const orig = this.originalTexts.get(current);
      if (orig && current.nodeValue !== orig) {
        this.safeSetNodeValue(current, orig);
      }
      current = walker.nextNode();
    }
  }

  private safeSetNodeValue(node: Node, val: string): void {
    this.isMutating = true;
    try {
      node.nodeValue = val;
    } finally {
      this.isMutating = false;
    }
  }

  private replaceTextPreservingWhitespace(node: Node, original: string, translated: string): void {
    const leading = original.match(/^\s*/)?.[0] || "";
    const trailing = original.match(/\s*$/)?.[0] || "";
    const replacement = `${leading}${translated}${trailing}`;
    if (node.nodeValue !== replacement) {
      this.safeSetNodeValue(node, replacement);
    }
  }

  private isIgnoredElement(el: Element): boolean {
    if (IGNORED_TAGS.has(el.tagName)) return true;
    if (
      el.getAttribute("translate") === "no" ||
      el.hasAttribute("data-no-translate") ||
      el.classList?.contains("notranslate") ||
      el.closest?.("[data-no-translate], [translate='no'], .notranslate")
    ) {
      return true;
    }
    return false;
  }

  /**
   * Debounces unknown phrases and calls the Gemini batch endpoint.
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.flushBatch();
    }, 120);
  }

  private async flushBatch(): Promise<void> {
    if (this.pendingBatch.size === 0 || this.activeLang === "en") return;

    const currentLang = this.activeLang;
    const batchCopy = new Map(this.pendingBatch);
    this.pendingBatch.clear();

    const textsToFetch = Array.from(batchCopy.keys()).filter(
      (txt) => !this.inFlightRequests.has(`${currentLang}:${txt}`)
    );

    if (textsToFetch.length === 0) return;

    textsToFetch.forEach((t) => this.inFlightRequests.add(`${currentLang}:${t}`));

    try {
      const resp = await fetch(`${API_BASE_URL}/translate/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: textsToFetch,
          target_lang: currentLang,
        }),
      });

      if (!resp.ok) return;

      const data = await resp.json();
      const translations: Record<string, string> = data.translations || {};

      for (const [orig, translated] of Object.entries(translations)) {
        if (translated && translated !== orig) {
          setCachedTranslation(orig, currentLang, translated);

          // Update all waiting DOM text nodes
          const nodes = batchCopy.get(orig);
          if (nodes && this.activeLang === currentLang) {
            nodes.forEach((node) => {
              if (node.isConnected) {
                const original = this.originalTexts.get(node) || orig;
                this.replaceTextPreservingWhitespace(node, original, translated);
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Auto-translate batch request failed:", e);
    } finally {
      textsToFetch.forEach((t) => this.inFlightRequests.delete(`${currentLang}:${t}`));
    }
  }
}

// Global Singleton
export const domAutoTranslator = new DomAutoTranslator();
