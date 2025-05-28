// Esta declaración permite importar archivos CSS en TypeScript
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Para soporte de módulos CSS
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Para soporte de módulos SCSS
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Para soporte de módulos SASS
declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// Para soporte de módulos LESS
declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}

// Para soporte de módulos Stylus
declare module '*.module.styl' {
  const classes: { [key: string]: string };
  export default classes;
}
