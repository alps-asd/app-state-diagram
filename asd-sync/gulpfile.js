const gulp = require('gulp');
const browserSync = require('browser-sync');
const { execSync }  = require('child_process');
const minimist = require('minimist');
const path = require('path');

const options = minimist(process.argv.slice(2), {
    string: 'profile',
    default: {
        profile: __dirname + '/alps/alps.json',
        port: 3000,
    }
});
const profile = options.profile;
const baseDir = path.dirname(profile);
const port = options.port;

function serve(cb) {
    browserSync({
        server: {
            baseDir: baseDir,
        },
        ghostMode: false,
        open: 'external',
        notify: true,
        port: port,
    });
    cb();
}

function reload(cb) {
    browserSync.reload();
    cb();
}

function asd(cb) {
    const asdPath = `${__dirname}/../bin/asd`;
    const cmd = `${asdPath}  ${profile}`;
    try {
        console.log(execSync(cmd).toString());
   } catch (error) {
        const errorMessage = "Error: " + error.message.substring( error.message.indexOf('asd: ') + 4);
        browserSync.notify(errorMessage, 600000);
        this.emit('end');
        console.error(error.message);
    }
    cb();
}

function watch() {
    gulp.watch(profile, gulp.series(asd, reload));
}

exports.default = gulp.series(
    asd,
    gulp.parallel(serve, watch)
);
