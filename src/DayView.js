// @flow
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import populateEvents from './Packer';
import React from 'react';
import moment from 'moment';
import _ from 'lodash';

const LEFT_MARGIN = 50;
const CALENDER_HEIGHT = 2400;
const TEXT_LINE_HEIGHT = 17;

function range(from, to) {
  return Array.from(Array(to), (_, i) => from + i);
}

function calculateInitPosition(props, packedEvents, calendarHeight) {
  let initPosition = _.min(_.map(packedEvents, 'top')) - calendarHeight / (props.end - props.start);
  return initPosition < 0 ? 0 : initPosition;
}

function fetchEventsAndPosition(props, calendarHeight) {
  const width = props.width - LEFT_MARGIN;
  const packedEvents = populateEvents(props.events, props.width, props.start);
  const initPosition = calculateInitPosition(props, packedEvents, calendarHeight);
  return { _scrollY: initPosition, packedEvents };
}

export default class DayView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.calendarHeight = (props.end - props.start) * 100;
    this.state = fetchEventsAndPosition(props, this.calendarHeight);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const state = fetchEventsAndPosition(nextProps, this.calendarHeight);
    this.setState(state, () => {
      this.props.scrollToFirst && this.scrollToFirst();
    });
  }

  componentDidMount() {
    this.props.scrollToFirst && this.scrollToFirst();
  }

  scrollToFirst() {
    setTimeout(() => {
      if (this.state && this.state._scrollY && this._scrollView) {
        this._scrollView.scrollTo({
          x: 0,
          y: this.state._scrollY,
          animated: true,
        });
      }
    }, 1);
  }

  _renderRedLine() {
    const offset = 100;
    const { format24h } = this.props;
    const { width, styles } = this.props;
    const timeNowHour = moment().hour();
    const timeNowMin = moment().minutes();
    return (
      <View
        key={`timeNow`}
        style={[
          styles.lineNow,
          {
            top:
              offset * (timeNowHour - this.props.start) +
              (offset * timeNowMin) / 60,
            width: width - 20,
          },
        ]}
      />
    );
  }

  _renderLines() {
    const { format24h, start, end } = this.props;
    const offset = this.calendarHeight / (end - start);

    return range(start, end + 1).map((i, index) => {
      let timeText;
      if (i === start) {
        timeText = ``;
      } else if (i < 12) {
        timeText = !format24h ? `${i} AM` : i;
      } else if (i === 12) {
        timeText = !format24h ? `${i} PM` : i;
      } else if (i === 24) {
        timeText = !format24h ? `12 AM` : 0;
      } else {
        timeText = !format24h ? `${i - 12} PM` : i;
      }
      const { width, styles } = this.props;
      return [
        <Text
          key={`timeLabel${i}`}
          style={[styles.timeLabel, { top: offset * index - 6 }]}
        >
          {timeText}
        </Text>,
        i === start ? null : (
          <View
            key={`line${i}`}
            style={[styles.line, { top: offset * index, width: width - 20 }]}
          />
        ),
        <View
          key={`lineHalf${i}`}
          style={[
            styles.line,
            { top: offset * (index + 0.5), width: width - 20 },
          ]}
        />,
      ];
    });
  }

  _renderTimeLabels() {
    const { styles, start, end } = this.props;
    const offset = this.calendarHeight / (end - start);
    return range(start, end).map((item, i) => {
      return (
        <View key={`line${i}`} style={[styles.line, { top: offset * i }]} />
      );
    });
  }

  _onEventTapped(event) {
    this.props.eventTapped(event);
  }

  _renderEvents() {
    const { styles } = this.props;
    const { packedEvents } = this.state;
    let events = packedEvents.map((event, i) => {
      const style = {
        top: event.top,
        left: event.left,
        width: event.width,
        height: event.height,
      };

      const eventColor = {
        backgroundColor: event.color,
      };

      // Fixing the number of lines for the event title makes this calculation easier.
      // However it would make sense to overflow the title to a new line if needed
      const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
      const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A';

      return (
        <TouchableOpacity
          key={i}
          activeOpacity={0.5}
          onPress={() =>
            this._onEventTapped(this.props.events[event.index])
          }
          style={[styles.event, style, event.color && eventColor, event.styles.event]}
        >
          {this.props.renderEvent ? (
            this.props.renderEvent(event)
          ) : (
            <View>
              {numberOfLines > 1 ? (
                <Text style={[styles.eventTimes, event.styles.eventTimes]} numberOfLines={1}>
                  {moment(event.start).format(formatTime)} -{' '}
                  {moment(event.end).format(formatTime)}
                </Text>
              ) : null}
              <Text numberOfLines={1} style={[styles.eventTitle, event.styles.eventTitle]}>
                {event.title || 'Event'}
              </Text>
              {numberOfLines > 2 ? (
                <Text
                  numberOfLines={numberOfLines - 1}
                  style={[styles.eventSummary, event.styles.eventSummary]}
                >
                  {event.summary || ' '}
                </Text>
              ) : null}
            </View>
          )}
        </TouchableOpacity>
      );
    });

    return (
      <View>
        <View style={{ marginLeft: LEFT_MARGIN }}>{events}</View>
      </View>
    );
  }

  render() {
    const { styles } = this.props;
    return (
      <ScrollView
        ref={ref => (this._scrollView = ref)}
        contentContainerStyle={[
          styles.contentStyle,
          { width: this.props.width },
        ]}
      >
        {this._renderLines()}
        {this._renderEvents()}
        {this._renderRedLine()}
      </ScrollView>
    );
  }
}
