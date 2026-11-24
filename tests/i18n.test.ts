import { describe, expect, it } from "vitest";
import { translate } from "../shared/i18n";
import { vietnamese } from "../shared/locales/vi";

describe("English / Vietnamese messages", () => {
  it("keeps English as the source language and falls back for unknown diagnostics", () => {
    expect(translate("en", "Add Project")).toBe("Add Project");
    expect(translate("en", "{0} repositories", { 0: 3 })).toBe(
      "3 repositories",
    );
    expect(translate("vi", "ECONNRESET: upstream closed")).toBe(
      "ECONNRESET: upstream closed",
    );
    expect(translate("vi", "toString")).toBe("toString");
  });
  it("preserves required product terms throughout the Vietnamese catalogue", () => {
    expect(translate("vi", "Dashboard")).toBe("Dashboard");
    expect(translate("vi", "Projects")).toBe("project");
    expect(translate("vi", "Ports")).toBe("port");
    expect(Object.values(vietnamese).join("\n")).not.toMatch(
      /dự án|cổng|bảng điều khiển/iu,
    );
  });
  it("localizes messages without translating or re-interpolating user data", () => {
    const name = "Settings {1} / Khách hàng";
    expect(
      translate("vi", "No backups yet. Save “{0}” to get started.", {
        0: name,
      }),
    ).toBe(`Chưa có bản sao lưu. Lưu “${name}” để bắt đầu.`);
    expect(translate("vi", "Main app: Path copied")).toBe(
      "Main app: Đã sao chép đường dẫn",
    );
    expect(
      translate("vi", "{0} projects · {1} repositories", { 0: 2, 1: 5 }),
    ).toBe("2 project · 5 repository");
  });
  it("localizes validation messages and keeps JSX spacing", () => {
    expect(translate("vi", "Name is required")).toBe("Vui lòng nhập tên");
    expect(
      translate("vi", "Too big: expected string to have <=120 characters"),
    ).toBe("Tối đa 120 ký tự");
    expect(translate("vi", " projects ")).toBe(" project ");
  });
});
