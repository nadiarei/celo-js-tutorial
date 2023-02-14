let webpack = require("webpack");
let webpackDevServer = require("webpack-dev-server");
let webpackConfig = require("./webpack.config");

let webpackDevServerOptions = {
  publicPath: "/",
  historyApiFallback: true,
  hot: true,
  host: "0.0.0.0"
};

webpackDevServer.addDevServerEntrypoints(webpackConfig, webpackDevServerOptions);

let app = new webpackDevServer(webpack(webpackConfig), webpackDevServerOptions);

app.listen(process.env.PORT || 3000, () => console.log(`App listening on ${port}`));
