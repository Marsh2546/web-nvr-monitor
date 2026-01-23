import { PageType, PageName } from "./PageWrappers";
import { DashboardPage, StatusPage } from "./PageWrappers";

export class PageRegistry {
  private static readonly pages: Map<PageName, PageType> = new Map([
    ["dashboard", DashboardPage],
    ["status", StatusPage],
  ]);

  static getPage(pageName: PageName): PageType | undefined {
    return this.pages.get(pageName);
  }

  static getAllPages(): Map<PageName, PageType> {
    return new Map(this.pages);
  }

  static getPageNames(): PageName[] {
    return Array.from(this.pages.keys());
  }

  static getPageDisplayNames(): Map<PageName, string> {
    const displayNames = new Map<PageName, string>();
    this.pages.forEach((PageClass, pageName) => {
      displayNames.set(pageName, PageClass.getDisplayName());
    });
    return displayNames;
  }

  static isValidPage(pageName: string): pageName is PageName {
    return this.pages.has(pageName as PageName);
  }
}
