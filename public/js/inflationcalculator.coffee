discount = (table, amount, start_year, end_year=(new Date()).getFullYear()) ->
  (amount * (table[end_year] / table[start_year]))

percent_change = (start,end) ->
  ((end-start)/start*100).toFixed(2)

# Selects a subset of years and returns an array of years and discounted values starting at $1.00
graph_data = (list, start, end) ->
  selected = _.where _.pairs(list), (a) -> a[0] >= start and a[0] <= end
  _.map selected, (a) ->
    [parseInt(a[0]), discount(list, 1, start, a[0])]

draw_graph = (start,end) ->
  margin_sides = 60
  margin_top = 30
  raw_width = parseInt(d3.select("#chart").style('width'),10)
  width = raw_width - margin_sides
  height = raw_width - margin_top * 2

  xScale = d3.scale.linear().domain([start, end]).range([0, width]);
  yScale = d3.scale.linear().domain([1, discount(cpis, 1, start, end)]).range([height, 0]);

  lineFunction = d3.svg.line()
    .x((d) -> xScale d[0])
    .y((d) -> yScale d[1])
    .interpolate("linear")

  xAxis = d3.svg.axis().scale(xScale).tickFormat(d3.format(".0f")).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(d3.format("$.2f"));

  years = _.map _.keys(cpis), (y) -> parseInt(y)
  amounts = _.map _.values(cpis), (v) ->

  $("#chart").empty()
  svg = d3.select("#chart").append("svg")
    .attr("width", width+margin_sides*2)
    .attr("height", height+margin_top)
    .append("g")
    .attr("transform", "translate(" + margin_sides + ",0)");

  svg.append("g")
      .attr("class","axis")
      .attr("transform", "translate(0,#{height})")
      .call(xAxis)

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)

  svg.append("path")
    .attr("d", lineFunction(graph_data(cpis, start, end)))
    .attr("class","graphline")

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
    draw_graph(@state.start,@state.end)

  empty: (event) ->
    event.target.value = ""

  updateEnd: (event) ->
    new_end = parseInt event.target.value
    @setState
      end: new_end
      result: discount(cpis, @state.input, @state.start, new_end)
    draw_graph(@state.start,new_end)

  updateStart: (event) ->
    new_start = parseInt event.target.value
    @setState
      start: new_start
      result: discount(cpis, @state.input, new_start, @state.end)
    draw_graph(new_start,@state.end)

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
  react = React.renderComponent(monies,document.getElementById("wrapper"))
  Select.init({className: 'select-theme-default year-select'})
  draw_graph(react.state.start,react.state.end)
  d3.select(window).on('resize', -> draw_graph(react.state.start,react.state.end))

$(init)