var appRoot = 'src/';
var outputRoot = 'dist/';
var exporSrvtRoot = 'export/'

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  sourceJs: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  css: 'styles/**/*.scss',
  cssDist: 'styles/',
  style: 'styles/**/*.css',
  output: outputRoot,
  exportSrv: exporSrvtRoot,
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/**/*.ts',
  e2eSpecsDist: 'test/e2e/dist/',
  dtsSrc: [
    'typings/**/*.ts',
    './jspm_packages/**/*.d.ts'
  ]
}
