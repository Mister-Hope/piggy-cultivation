const { dest, parallel, src, watch } = require("gulp");
const rename = require("gulp-rename");
const { sass } = require("@mr-hope/gulp-sass");
const typescript = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");

const appTSProject = typescript.createProject("tsconfig.app.json");
const cloudTSProject = typescript.createProject("tsconfig.cloud.json");

const buildWXSS = () =>
  src("app/**/*.scss")
    .pipe(
      sass({
        style: "compressed",
        importers: [
          // preserve `@import` rules
          {
            canonicalize: (url, { fromImport }) =>
              fromImport
                ? new URL(`wx:import?path=${url.replace(/^import:/, "")}`)
                : null,
            load: (canonicalUrl) => ({
              contents: `@import "${canonicalUrl.searchParams.get(
                "path"
              )}.wxss"`,
              syntax: "css",
            }),
          },
        ],
      }).on("error", sass.logError)
    )
    .pipe(rename({ extname: ".wxss" }))
    .pipe(dest("dist/app"));

const moveAppFiles = () =>
  src("app/**/*.{wxml,wxs,json,svg,png,webp}").pipe(dest("dist/app"));

const moveCloudFiles = () => src("cloud/**/*.json").pipe(dest("dist/cloud"));

const watchWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildWXSS);

const buildAppTypesciprt = () =>
  appTSProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(appTSProject())
    .pipe(sourcemaps.write(".", { includeContent: false }))
    .pipe(dest("dist/app"));

const buildCloudTypesciprt = () =>
  cloudTSProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(cloudTSProject())
    .pipe(sourcemaps.write(".", { includeContent: false }))
    .pipe(dest("dist/cloud"));

const watchAppTypescript = () =>
  watch("app/**/*.ts", { ignoreInitial: false }, buildAppTypesciprt);

const watchCloudTypescript = () =>
  watch("cloud/**/*.ts", { ignoreInitial: false }, buildCloudTypesciprt);

const watchAppFiles = () =>
  watch(
    "app/**/*.{wxml,wxs,json,svg,png,webp}",
    { ignoreInitial: false },
    moveAppFiles
  );
const watchCloudFiles = () =>
  watch(
    "cloud/**/*.{wxml,wxs,json,svg,png}",
    { ignoreInitial: false },
    moveCloudFiles
  );

const watchApp = parallel(watchWXSS, watchAppTypescript, watchAppFiles);

const watchCloud = parallel(watchCloudTypescript, watchCloudFiles);

const watchCommand = parallel(
  watchWXSS,
  watchAppTypescript,
  watchCloudTypescript,
  watchAppFiles,
  watchCloudFiles
);

const buildApp = parallel(buildWXSS, buildAppTypesciprt, moveAppFiles);

const buildCloud = parallel(
  buildCloudTypesciprt,

  moveCloudFiles
);

const build = parallel(
  buildWXSS,
  buildAppTypesciprt,
  buildCloudTypesciprt,
  moveAppFiles,
  moveCloudFiles
);

exports.watchApp = watchApp;
exports.watchCloud = watchCloud;
exports.watch = watchCommand;

exports.buildApp = buildApp;
exports.buildCloud = buildCloud;
exports.build = build;

exports.default = build;
