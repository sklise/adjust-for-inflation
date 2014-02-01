// Compiled by ClojureScript 0.0-2030
goog.provide('inflationcalculator.inflationcalculator');
goog.require('cljs.core');
goog.require('cljs.core.async');
goog.require('goog.Uri');
goog.require('goog.net.Jsonp');
goog.require('cljs.core.async');
goog.require('goog.events');
goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.dom');
inflationcalculator.inflationcalculator.cpis = cljs.core.PersistentHashMap.fromArrays([2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014],[172.2,177.1,179.9,184.0,188.9,195.3,201.6,207.342,215.303,214.537,218.056,224.939,229.594,233.069,233.069]);
inflationcalculator.inflationcalculator.listen = (function listen(el,type){var out = cljs.core.async.chan.call(null);goog.events.listen(el,type,(function (e){return cljs.core.async.put_BANG_.call(null,out,e);
}));
return out;
});
inflationcalculator.inflationcalculator.get_value = (function get_value(id){return goog.dom.getElement(id).value;
});
inflationcalculator.inflationcalculator.discount = (function() {
var discount = null;
var discount__3 = (function (table,amount,target_year){return discount.call(null,amount,(new Date()).getFullYear(),target_year,table);
});
var discount__4 = (function (table,amount,base_year,target_year){return (amount * (cljs.core.get.call(null,table,target_year) / cljs.core.get.call(null,table,base_year)));
});
discount = function(table,amount,base_year,target_year){
switch(arguments.length){
case 3:
return discount__3.call(this,table,amount,base_year);
case 4:
return discount__4.call(this,table,amount,base_year,target_year);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
discount.cljs$core$IFn$_invoke$arity$3 = discount__3;
discount.cljs$core$IFn$_invoke$arity$4 = discount__4;
return discount;
})()
;
inflationcalculator.inflationcalculator.bind_key = (function bind_key(num,input){var clicks = inflationcalculator.inflationcalculator.listen.call(null,goog.dom.getElement([cljs.core.str("key-"),cljs.core.str(num)].join('')),"click");var output = goog.dom.getElement(input);var startyear = (inflationcalculator.inflationcalculator.get_value.call(null,"start-year") | 0);var targetyear = (inflationcalculator.inflationcalculator.get_value.call(null,"end-year") | 0);var c__5494__auto__ = cljs.core.async.chan.call(null,1);cljs.core.async.impl.dispatch.run.call(null,(function (){var f__5495__auto__ = (function (){var switch__5424__auto__ = (function (state_22968){var state_val_22969 = (state_22968[1]);if((state_val_22969 === 7))
{var inst_22953 = (state_22968[2]);var inst_22954 = output.value;var inst_22955 = [cljs.core.str(inst_22954),cljs.core.str(num)].join('');var inst_22956 = output.value = inst_22955;var inst_22957 = goog.dom.getElement("output-val");var inst_22958 = output.value;var inst_22959 = inflationcalculator.inflationcalculator.discount.call(null,inflationcalculator.inflationcalculator.cpis,inst_22958,startyear,targetyear);var inst_22960 = inst_22957.innerHTML = inst_22959;var state_22968__$1 = (function (){var statearr_22970 = state_22968;(statearr_22970[7] = inst_22956);
(statearr_22970[8] = inst_22960);
(statearr_22970[9] = inst_22953);
return statearr_22970;
})();var statearr_22971_22984 = state_22968__$1;(statearr_22971_22984[2] = null);
(statearr_22971_22984[1] = 2);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_22969 === 6))
{var inst_22964 = (state_22968[2]);var state_22968__$1 = state_22968;var statearr_22972_22985 = state_22968__$1;(statearr_22972_22985[2] = inst_22964);
(statearr_22972_22985[1] = 3);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_22969 === 5))
{var state_22968__$1 = state_22968;var statearr_22973_22986 = state_22968__$1;(statearr_22973_22986[2] = null);
(statearr_22973_22986[1] = 6);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_22969 === 4))
{var state_22968__$1 = state_22968;return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null,state_22968__$1,7,clicks);
} else
{if((state_val_22969 === 3))
{var inst_22966 = (state_22968[2]);var state_22968__$1 = state_22968;return cljs.core.async.impl.ioc_helpers.return_chan.call(null,state_22968__$1,inst_22966);
} else
{if((state_val_22969 === 2))
{var state_22968__$1 = state_22968;if(true)
{var statearr_22974_22987 = state_22968__$1;(statearr_22974_22987[1] = 4);
} else
{var statearr_22975_22988 = state_22968__$1;(statearr_22975_22988[1] = 5);
}
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_22969 === 1))
{var state_22968__$1 = state_22968;var statearr_22976_22989 = state_22968__$1;(statearr_22976_22989[2] = null);
(statearr_22976_22989[1] = 2);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{return null;
}
}
}
}
}
}
}
});return ((function (switch__5424__auto__){
return (function() {
var state_machine__5425__auto__ = null;
var state_machine__5425__auto____0 = (function (){var statearr_22980 = (new Array(10));(statearr_22980[0] = state_machine__5425__auto__);
(statearr_22980[1] = 1);
return statearr_22980;
});
var state_machine__5425__auto____1 = (function (state_22968){while(true){
var ret_value__5426__auto__ = (function (){try{while(true){
var result__5427__auto__ = switch__5424__auto__.call(null,state_22968);if(cljs.core.keyword_identical_QMARK_.call(null,result__5427__auto__,new cljs.core.Keyword(null,"recur","recur",1122293407)))
{{
continue;
}
} else
{return result__5427__auto__;
}
break;
}
}catch (e22981){if((e22981 instanceof Object))
{var ex__5428__auto__ = e22981;var statearr_22982_22990 = state_22968;(statearr_22982_22990[5] = ex__5428__auto__);
cljs.core.async.impl.ioc_helpers.process_exception.call(null,state_22968);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if(new cljs.core.Keyword(null,"else","else",1017020587))
{throw e22981;
} else
{return null;
}
}
}})();if(cljs.core.keyword_identical_QMARK_.call(null,ret_value__5426__auto__,new cljs.core.Keyword(null,"recur","recur",1122293407)))
{{
var G__22991 = state_22968;
state_22968 = G__22991;
continue;
}
} else
{return ret_value__5426__auto__;
}
break;
}
});
state_machine__5425__auto__ = function(state_22968){
switch(arguments.length){
case 0:
return state_machine__5425__auto____0.call(this);
case 1:
return state_machine__5425__auto____1.call(this,state_22968);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
state_machine__5425__auto__.cljs$core$IFn$_invoke$arity$0 = state_machine__5425__auto____0;
state_machine__5425__auto__.cljs$core$IFn$_invoke$arity$1 = state_machine__5425__auto____1;
return state_machine__5425__auto__;
})()
;})(switch__5424__auto__))
})();var state__5496__auto__ = (function (){var statearr_22983 = f__5495__auto__.call(null);(statearr_22983[cljs.core.async.impl.ioc_helpers.USER_START_IDX] = c__5494__auto__);
return statearr_22983;
})();return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped.call(null,state__5496__auto__);
}));
return c__5494__auto__;
});
inflationcalculator.inflationcalculator.bind_input = (function bind_input(i){return (function (n){return inflationcalculator.inflationcalculator.bind_key.call(null,n,i);
});
});
inflationcalculator.inflationcalculator.bind_number_key = inflationcalculator.inflationcalculator.bind_input.call(null,"input-val");
inflationcalculator.inflationcalculator.init = (function init(){inflationcalculator.inflationcalculator.bind_number_key.call(null,1);
inflationcalculator.inflationcalculator.bind_number_key.call(null,2);
inflationcalculator.inflationcalculator.bind_number_key.call(null,3);
inflationcalculator.inflationcalculator.bind_number_key.call(null,4);
inflationcalculator.inflationcalculator.bind_number_key.call(null,5);
inflationcalculator.inflationcalculator.bind_number_key.call(null,6);
inflationcalculator.inflationcalculator.bind_number_key.call(null,7);
inflationcalculator.inflationcalculator.bind_number_key.call(null,8);
inflationcalculator.inflationcalculator.bind_number_key.call(null,9);
inflationcalculator.inflationcalculator.bind_number_key.call(null,0);
return inflationcalculator.inflationcalculator.bind_number_key.call(null,".");
});
inflationcalculator.inflationcalculator.init.call(null);

//# sourceMappingURL=inflationcalculator.js.map