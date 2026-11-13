// 🎨 Estilos de Tu Agenda ARMADOS de antemano (antes el celular los calculaba cada vez con cdn.tailwindcss.com: lento).
//    Cada vez que se agreguen clases nuevas en los .html o .js de la página, se vuelve a armar:
//      npx tailwindcss@3.4.17 -c tailwind.config.js -i tailwind.entrada.css -o tailwind.css --minify
//    (el banco de la página avisa si falta alguna clase con valor propio, tipo text-[14.5px])
module.exports = {
  content: ['./index.html', './admin.html', './super.html', './404.html', './privacidad.html', './app.js', './admin.js', './super.js', './common.js'],
  theme: {
    extend: {
      colors: { ink: '#17222E', paper: '#EEF1EF', line: '#D3DAD6', 'pole-red': '#B3202A', 'pole-blue': '#24508A', brass: '#A9844E' },
      // las letras de la página son Inter (texto) y Sora (títulos); ya no se cargan Archivo, Bricolage ni Figtree (nadie las veía)
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'], narrow: ['Sora', 'Inter', 'system-ui', 'sans-serif'] }
    }
  }
};
