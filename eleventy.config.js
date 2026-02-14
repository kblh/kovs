const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("date", (dateObj, format = "d. M. yyyy") => {
    if (!dateObj) return "";
    const dt =
      dateObj instanceof Date
        ? DateTime.fromJSDate(dateObj, { zone: "utc" })
        : DateTime.fromISO(String(dateObj), { zone: "utc" });
    return dt.isValid ? dt.toFormat(format) : String(dateObj);
  });

  eleventyConfig.addFilter("getGalleryImages", (folder) => {
    if (!folder || typeof folder !== "string") return [];
    const thumbsDir = path.join(process.cwd(), folder, "thumbs");
    if (!fs.existsSync(thumbsDir)) return [];
    const files = fs.readdirSync(thumbsDir);
    return files
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort()
      .map((filename) => ({
        origPath: `/${path.join(folder, "orig", filename).replace(/\\/g, "/")}`,
        thumbPath: `/${path.join(folder, "thumbs", filename).replace(/\\/g, "/")}`,
      }));
  });

  eleventyConfig.addPassthroughCopy("fotogalerie");
};
