import usaddress
import json
import sys

try:
    tag = usaddress.tag(sys.argv[1])
    address = dict(tag[0])
    print(json.dumps(address))

except:
    try:
        addr = sys.argv[1].split(" ")
        del addr[0]
        tag = usaddress.tag(" ".join(addr))
        address = dict(tag[0])
        print(json.dumps(address))
    except:
        try:
            addr = sys.argv[1].split(" ")
            del addr[0]
            del addr[0]
            tag = usaddress.tag(" ".join(addr))
            address = dict(tag[0])
            print(json.dumps(address))
        except:
            try:
                addr = sys.argv[1].split(" ")
                del addr[0]
                del addr[0]
                del addr[0]
                tag = usaddress.tag(" ".join(addr))
                address = dict(tag[0])
                print(json.dumps(address))
            except:
                try:
                    addr = sys.argv[1].split(" ")
                    del addr[0]
                    del addr[0]
                    del addr[0]
                    del addr[0]
                    tag = usaddress.tag(" ".join(addr))
                    address = dict(tag[0])
                    print(json.dumps(address))
                except:
                    try:
                        addr = sys.argv[1].split(" ")
                        del addr[0]
                        del addr[0]
                        del addr[0]
                        del addr[0]
                        del addr[0]
                        tag = usaddress.tag(" ".join(addr))
                        address = dict(tag[0])
                        print(json.dumps(address))
                    except:
                        try:
                            addr = sys.argv[1].split(" ")
                            del addr[0]
                            del addr[0]
                            del addr[0]
                            del addr[0]
                            del addr[0]
                            del addr[0]
                            tag = usaddress.tag(" ".join(addr))
                            address = dict(tag[0])
                            print(json.dumps(address))
                        except:
                            try:
                                addr = sys.argv[1].split(" ")
                                del addr[0]
                                del addr[0]
                                del addr[0]
                                del addr[0]
                                del addr[0]
                                del addr[0]
                                del addr[0]
                                tag = usaddress.tag(" ".join(addr))
                                address = dict(tag[0])
                                print(json.dumps(address))
                            except:
                                try:
                                    addr = sys.argv[1].split(" ")
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    del addr[0]
                                    tag = usaddress.tag(" ".join(addr))
                                    address = dict(tag[0])
                                    print(json.dumps(address))
                                except:
                                    try:
                                        addr = sys.argv[1].split(" ")
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        del addr[0]
                                        tag = usaddress.tag(" ".join(addr))
                                        address = dict(tag[0])
                                        print(json.dumps(address))
                                    except:
                                        try:
                                            addr = sys.argv[1].split(" ")
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            del addr[0]
                                            tag = usaddress.tag(" ".join(addr))
                                            address = dict(tag[0])
                                            print(json.dumps(address))
                                        except:
                                            print("false")


