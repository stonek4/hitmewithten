import * as gulp from "gulp";
import * as project from "../aurelia.json";
import gulpTslint from "gulp-tslint";
import { Linter } from "tslint";
import * as ts from "typescript";

export default function lint() {
    const program = Linter.createProgram('tsconfig.json');
    // (https://github.com/panuhorsmalahti/gulp-tslint/issues/105)
    // Needed to add this undocumented line for the linter to work
    ts.getPreEmitDiagnostics(program);
    return gulp.src(project.transpiler.source)
        .pipe(gulpTslint({ formatter: "codeFrame", program: program }))
        .pipe(gulpTslint.report({
            emitError: false,
            reportLimit: 0
        }));
}
