import * as gulp from 'gulp';
import * as project from '../aurelia.json';

export default function dist() {
    return gulp.src(project.dist.sources, { "base" : "." })
        .pipe(gulp.dest(project.dist.output));
}
