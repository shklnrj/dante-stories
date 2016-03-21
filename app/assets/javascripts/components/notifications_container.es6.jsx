class NotificationsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      newNotificationCount: 0,
      notifications: [],
      currentPage: null,
      nextPage: null
    };
  }

  componentWillMount() {
    this.fetchNotifications();
    // TODO: set timer to poll
  }

  render () {
    return (
      <div className="notification-container">
        <a className={`dropdown-toggle ${this.state.newNotificationCount > 0 ? 'active' : ''}`}
          onClick={() => this.handleMarkAsTouched()}
          data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
          {this.renderNotificationIcon()}
        </a>
        <ul
          className="dropdown-menu"
          id="notification-items"
          onScroll={() => this.handleScroll()}
          ref={(ref) => {this.dropdownRef = ref}}
        >
          <li>
            <div>
              <span>Notifications</span>
              <a className="pull-right" onClick={(e) => this.handleMarkAllAsRead(e)}>
                Mark All as Read
              </a>
            </div>
          </li>
          {this.renderNotificationItems()}
          {this.loadMoreButton()}
        </ul>
      </div>
    );
  }

  fetchNotifications() {
    $.ajax({
      url: "/api/notifications.json",
      dataType: "JSON",
      method: "GET",
      success: (data) => {
        this.setState({
          newNotificationCount: data.new_notification_count,
          currentPage: data.current_page,
          nextPage: data.next_page,
          notifications: data.notifications
        });
      }
    });
  }

  renderNotificationIcon() {
    if (this.state.newNotificationCount > 0) {
      return (
        <span id="new-notifications-count">
          {this.state.newNotificationCount}
        </span>
      );
    } else {
      return (
        <span className="icon-bell-o notification-bell" id="bell"></span>
      );
    }
  }

  renderNotificationItems() {
    if (!this.state.notifications.length) {
      return (<li><a>No notifications yet</a></li>);
    }

    return this.state.notifications.map(notification => {
      return (<NotificationItem key={notification.id} {...notification} />);
    });
  }

  // Keep this as a fallack fro handleScroll
  loadMoreButton() {
    if (this.state.nextPage === null) {
      return;
    }
    return (
      <li>
        <a onMouseOver={() => this.handleLoadMore()}>
          See More
        </a>
      </li>
    );
  }

  handleMarkAsTouched() {
    if (this.state.newNotificationCount === 0 ) { return; }
    $.ajax({
      url: '/api/notifications/mark_as_touched',
      method: 'POST',
      dataType: 'JSON',
      success: () => {
        this.setState({
          newNotificationCount: 0
        });
      }
    });
  }

  handleScroll() {
    let scrollHeight = $(this.dropdownRef)[0].scrollHeight;
    const OFFSET = 50;
    let scrollTop = $(this.dropdownRef).scrollTop(); 
    if (scrollHeight - (scrollTop + OFFSET) < $(this.dropdownRef).innerHeight()) {
      this.handleLoadMore();
    }
  }

  handleMarkAllAsRead() {
    $(this.dropdownRef).parent().addClass('open'); // workaround jquery dropdown
    $.ajax({
      url: '/api/notifications/mark_all_as_read',
      method: 'POST',
      dataType: 'json',
      success: () => {
        this.setState({
          notifications: this.state.notifications.map(notification => {
            return { ...notification, unread: false };
          })
        });
      }
    });
  }

  handleLoadMore() {
    if (this.fetching || !this.state.nextPage) { return; }
    this.fetching = true;
    $.ajax({
      url: `/api/notifications.json/?page=${this.state.nextPage}`,
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        this.fetching = false;
        this.setState({
          newNotificationCount: data.new_notification_count,
          currentPage: data.current_page,
          nextPage: data.next_page,
          notifications: [ ...this.state.notifications, ...data.notifications ]
        });
      }
    });
  }

}
