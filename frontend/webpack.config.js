// Copyright (C) 2021 Chronoscope. All rights reserved.

const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                exclude: /node_modules/
            }
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: "assets"},
            ],
        }),
        new HtmlWebpackPlugin({
            template: 'src/ui/index.html',
            hash: true
        })
    ]
};
