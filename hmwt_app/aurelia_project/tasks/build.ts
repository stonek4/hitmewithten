import * as gulp from 'gulp';
import transpile from './transpile';
import processMarkup from './process-markup';
import lint from './lint';
import processCSS from './process-css';
import {build} from 'aurelia-cli';
import dist from './dist'
import * as project from '../aurelia.json';

export default gulp.series(
  readProjectConfiguration,
  gulp.parallel(
    transpile,
    processMarkup,
    processCSS
  ),
  lint,
  writeBundles,
  dist
);

function readProjectConfiguration() {
  return build.src(project);
}

function writeBundles() {
  return build.dest();
}
