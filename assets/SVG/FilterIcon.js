import React from 'react';
import { SvgXml } from 'react-native-svg';

const MySvgComponent = ({ width = 60, height = 60}) => {

  const svgXml = `
    <?xml version="1.0" encoding="utf-8"?>
    <!-- Your SVG XML content -->
    <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M456.96-182.77q-15.11 0-25.27-10.05-10.15-10.05-10.15-24.72v-230L194.39-736.23q-10.62-12.43-2.86-26.71 7.76-14.29 23.02-14.29h530.96q15.26 0 22.99 14.29 7.73 14.28-2.89 26.71L538.46-447.54v230q0 14.67-10.15 24.72-10.16 10.05-25.27 10.05h-46.08ZM480-444.46l227.92-288.92H252.08L480-444.46Zm0 0Z"/></svg>
    
    `;
  return <SvgXml xml={svgXml} width={width} height={height} />;
};

export default MySvgComponent;

