(defproject inflation-calculator "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-2030"]
                 [org.clojure/core.async "0.1.256.0-1bf8cf-alpha"]] ;; ADD

  :plugins [[lein-cljsbuild "1.0.1"]]

  :source-paths ["src"]

  :cljsbuild
    {:builds [{:id "inflationcalculator"
               :source-paths ["src"],
               :compiler {
                  :source-map "inflationcalculator.js.map",
                  :output-to "public/inflationcalculator.js",
                  :output-dir "public"
                  :optimizations :none}}]})