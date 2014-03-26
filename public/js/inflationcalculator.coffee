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

init = ->
  window.monies = Monies()
  React.renderComponent(monies,document.getElementById("container"))
  Select.init({className: 'select-theme-default year-select'})

$(init)
