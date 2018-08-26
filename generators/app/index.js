const path = require('path')
const Generator = require('yeoman-generator')
const chalk = require('chalk')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts)

    // will be populated during prompt and passed to templates
    this.props = {}

    this.argument('path', {
      type: String,
      required: true,
      desc: 'Where to generate the project (folder name, ".", or path)',
    })

    this.option('force', {
      desc:
        'Skip project name confirmation and always overwrite on file conflicts',
      default: false,
    })
  }

  initializing() {
    // absolute path to the project folder
    const projectPath = path.resolve(this.contextRoot, this.options.path)
    // just the folder name
    const projectName = path.basename(projectPath)

    this.props = {
      projectPath,
      projectName,
    }

    this.destinationRoot(projectPath)
  }

  async prompting() {
    if (this.options.force) {
      this.log('Skipping project name prompt because --force flag was given...')
      return
    }

    const props = await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'projectName',
        default: this.props.projectName,
      },
    ])

    Object.assign(this.props, props)
  }

  writing() {
    // copies text files, evaluating them as templates such that
    // the generator props can be <%= interpolated %> during
    // the copy.
    const copyTpl = (src, dest = src) => {
      this.fs.copyTpl(
        this.templatePath(src),
        this.destinationPath(dest),
        this.props
      )
    }

    copyTpl('README.md')
    copyTpl('elm-package.json')
    copyTpl('package.json')
    copyTpl('webpack.config.js')
    // dotfiles
    copyTpl('_gitignore', '.gitignore')
    copyTpl('.eslintrc.json')
    // src
    copyTpl('src/Main.elm')
    copyTpl('src/index.js')
    // public
    copyTpl('public/index.html')
    copyTpl('public/css/index.scss')
    // binary data (cannot use copyTpl)
    this.fs.copy(
      this.templatePath('public/img'),
      this.destinationPath('public/img')
    )
    this.fs.copy(
      this.templatePath('public/favicon.ico'),
      this.destinationPath('public/favicon.ico')
    )
  }

  install() {
    this.npmInstall()
    this.scheduleInstallTask('elm-package', [], { yes: true })
  }

  end() {
    this.log(`
    ${chalk.green('Project generated')}

    1. Start dev server: ${chalk.cyan('npm start')}
    2. Visit <http://localhost:3000>
    3. Make changes to src/Main.elm
    `)
  }
}
