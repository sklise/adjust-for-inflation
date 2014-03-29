discount = (table, amount, start_year, end_year=(new Date()).getFullYear()) ->
  (amount * (table[end_year] / table[start_year]))

percent_change = (start,end) ->
  ((end-start)/start*100).toFixed(2)

YearOption = React.createClass
  getInitialState: -> @props
  render: ->
    React.DOM.option
      value: @state.year
      children: @state.year

YearSelect = React.createClass
  getInitialState: ->
    s = @props
    s.data = cpis
    s
  render: ->
    t = @
    React.DOM.select {className:"year-select", id: @props.id, defaultValue: t.state.selected, onChange: @props.update },
      _.map @state.data, (cpis,year) ->
        YearOption {year:year,selected_value: t.state.selected}

Monies = React.createClass
  getInitialState: ->
    input: "1.00",
    start: 1940,
    end: 2013,
    result: discount(cpis, 1, 1913, 2012)

  handleInput: (event) ->
    new_float = parseFloat(event.target.value || 0)
    @setState
      input: "#{event.target.value}"
      result: discount(cpis, new_float, @state.start, @state.end)

  empty: (event) ->
    event.target.value = ""

  updateEnd: (event) ->
    @setState
      end: parseInt event.target.value
      result: discount(cpis, @state.input, @state.start, parseInt(event.target.value))

  updateStart: (event) ->
    @setState
      start: parseInt event.target.value
      result: discount(cpis, @state.input, parseInt(event.target.value), @state.end)

  render: ->
    changeInput = @handleInput

    React.DOM.div null,
      React.DOM.h1({children:"Adjust for Inflation"}),
      React.DOM.div({className:"left"},
        React.DOM.input
          type:"number"
          value: @state.input
          onInput: changeInput
          onFocus: @empty
        React.DOM.div {className:"preposition"}, "in"
      ),
      YearSelect({
        id:"start-year",
        data: cpis
        selected: @state.start
        update: @updateStart
      }),
      React.DOM.p {className: "explanation"}, "has the same buying power as"
      React.DOM.div({className: "left"},
        React.DOM.div {id:"output-value"}, "$#{@state.result.toFixed(2)}"
        React.DOM.div {className:"preposition"}, "in"
      ),
      YearSelect({
        id:"end-year",
        data:cpis,
        selected: @state.end
        update: @updateEnd
      }),
      React.DOM.p {className:"breakdown"}, "A change of #{percent_change(cpis[@state.start],cpis[@state.end])}% over #{Math.abs(@state.end - @state.start)} years."
      React.DOM.div {id:"chart"}

init = ->
  window.monies = Monies()
  React.renderComponent(monies,document.getElementById("wrapper"))
  Select.init({className: 'select-theme-default year-select'})

  width = 600
  height = 500

  xScale = d3.scale.linear().domain(
    [_.min(_.keys cpis), _.max(_.keys cpis)]
  ).range([0, width]);
  yScale = d3.scale.linear().domain([
    _.min(_.values cpis), _.max(_.values cpis)
  ]).range([height, 0]);

  xAxis = d3.svg.axis()
    .scale(xScale)
    .tickFormat(d3.format(".0f"))
    .orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  line = d3.svg.line().x((d) ->
    x(d.date)
  ).y((d) ->
    y(d.close)
  )

  margin = 40

  window.years = _.map _.keys(cpis), (y) ->
    parseInt(y)

  window.chart_data = _.zip(years, _.values(cpis))

  lineFunction = d3.svg.line()
    .x((d) -> xScale d[0])
    .y((d) -> yScale d[1])
    .interpolate("linear")

  svg = d3.select("#chart").append("svg")
    .attr("width", width+margin*2)
    .attr("height", height+margin*2)
    .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")");

  svg.append("g")
      .attr("class","axis")
      .attr("transform", "translate(0,#{height})")
      .call(xAxis)


  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("CPI")

  svg.append("path")
    .attr("d", lineFunction(chart_data))
    .attr("stroke", "#8CC3F2")
    .attr("stroke-width", 2)
    .attr("fill", "none")

$(init)
