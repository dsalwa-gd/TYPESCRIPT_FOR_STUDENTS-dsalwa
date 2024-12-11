const HTTP_POST_METHOD = "POST";
const HTTP_GET_METHOD = "GET";

type HttpMethod = typeof HTTP_POST_METHOD | typeof HTTP_GET_METHOD;

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

type HttpStatus =
  | typeof HTTP_STATUS_OK
  | typeof HTTP_STATUS_INTERNAL_SERVER_ERROR;

interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

interface ObserverRequest {
  method: HttpMethod;
  host: string;
  path: string;
  body?: User;
  params?: Record<string, string>;
}

interface SubscriptionHandler {
  next: (request: ObserverRequest) => { status: HttpStatus };
  error: (error: HttpStatus) => { status: HttpStatus };
  complete: () => void;
}

class Observer {
  private handlers: SubscriptionHandler;
  private isUnsubscribed: boolean;
  public _unsubscribe?: () => void;

  constructor(handlers: SubscriptionHandler) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: ObserverRequest) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: HttpStatus) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  private _subscribe: (observer: Observer) => () => void;

  constructor(subscribe: (observer: Observer) => () => void) {
    this._subscribe = subscribe;
  }

  static from(values: ObserverRequest[]) {
    return new Observable((observer: Observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: SubscriptionHandler) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: User = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: ObserverRequest[] = [
  {
    method: HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: ObserverRequest): { status: HttpStatus } => {
  // handling of request
  return { status: HTTP_STATUS_OK };
};
const handleError = (error: HttpStatus): { status: HttpStatus } => {
  // handling of error
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
} as SubscriptionHandler);

subscription.unsubscribe();
